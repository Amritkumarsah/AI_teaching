import zlib from 'zlib';

export interface ExtractedChunk {
  chunkIndex: number;
  pageNumber: number;
  chapter?: string;
  section?: string;
  heading?: string;
  text: string;
  tokensCount: number;
}

export interface ExtractionResult {
  pageCount: number;
  wordCount: number;
  characterCount: number;
  detectedChapters: string[];
  chunks: ExtractedChunk[];
}

export class ExtractorService {
  /**
   * Cleans and normalizes extracted text:
   * Strips control characters, normalizes Unicode spaces/quotes, removes excessive empty lines.
   */
  public cleanText(rawText: string): string {
    return rawText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove non-printable ASCII
      .replace(/[\u2018\u2019]/g, "'") // normalize curly single quotes
      .replace(/[\u201C\u201D]/g, '"') // normalize curly double quotes
      .replace(/[\u2013\u2014]/g, '-') // normalize em/en dashes
      .replace(/[ \t]+/g, ' ') // collapse horizontal spaces
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // collapse multiple blank lines
      .trim();
  }

  /**
   * Estimates token count (~4 characters per token on average for English/technical text)
   */
  public estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.length / 4));
  }

  /**
   * Main entrypoint for extracting text and structure from a file buffer
   */
  public async extract(buffer: Buffer, originalFilename: string, mimeType: string): Promise<ExtractionResult> {
    const ext = originalFilename.split('.').pop()?.toLowerCase() || '';

    let pagesText: { pageNumber: number; text: string }[] = [];

    if (ext === 'txt' || ext === 'md' || mimeType.includes('text/')) {
      pagesText = this.extractFromText(buffer);
    } else if (ext === 'docx' || mimeType.includes('wordprocessingml')) {
      pagesText = await this.extractFromDocx(buffer);
    } else if (ext === 'pptx' || mimeType.includes('presentationml')) {
      pagesText = await this.extractFromPptx(buffer);
    } else if (ext === 'pdf' || mimeType.includes('pdf')) {
      pagesText = await this.extractFromPdf(buffer);
    } else {
      // Fallback: UTF-8 / ASCII text stream scan
      const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 1000000));
      pagesText = [{ pageNumber: 1, text }];
    }

    if (pagesText.length === 0 || pagesText.every((p) => p.text.trim().length === 0)) {
      throw new Error('No readable text could be extracted from this document.');
    }

    // Structure detection & Chunking
    return this.structureAndChunk(pagesText);
  }

  /**
   * TXT & Markdown extraction
   */
  private extractFromText(buffer: Buffer): { pageNumber: number; text: string }[] {
    const fullText = buffer.toString('utf-8');
    // Estimate virtual pages (approx 500 words / 3000 chars per page)
    const pageSize = 3000;
    const pages: { pageNumber: number; text: string }[] = [];

    if (fullText.length <= pageSize) {
      return [{ pageNumber: 1, text: fullText }];
    }

    let offset = 0;
    let pageNum = 1;
    while (offset < fullText.length) {
      let end = offset + pageSize;
      if (end < fullText.length) {
        // Break at paragraph
        const nextBreak = fullText.indexOf('\n\n', end - 200);
        if (nextBreak !== -1 && nextBreak < end + 200) {
          end = nextBreak;
        }
      }
      pages.push({
        pageNumber: pageNum++,
        text: fullText.slice(offset, end),
      });
      offset = end;
    }

    return pages;
  }

  /**
   * DOCX extraction (PKZIP archive parsing of word/document.xml)
   */
  private async extractFromDocx(buffer: Buffer): Promise<{ pageNumber: number; text: string }[]> {
    try {
      const xmlString = await this.extractZipEntry(buffer, 'word/document.xml');
      if (!xmlString) {
        // Fallback: regex search for XML text in uncompressed stream
        return this.extractFromText(buffer);
      }

      // Extract text runs and paragraph styles
      const paragraphs = xmlString.split(/<\/w:p>/);
      const extractedLines: string[] = [];

      for (const p of paragraphs) {
        const isHeading = /<w:pStyle\s+w:val="(Heading\d+|Title)"/i.test(p);
        const textRuns: string[] = [];
        const textMatches = p.matchAll(/<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/g);
        for (const m of textMatches) {
          textRuns.push(m[1]);
        }
        const paragraphText = textRuns.join('').trim();
        if (paragraphText) {
          if (isHeading) {
            extractedLines.push(`\n## ${paragraphText}\n`);
          } else {
            extractedLines.push(paragraphText);
          }
        }
      }

      const fullText = extractedLines.join('\n\n');
      return this.extractFromText(Buffer.from(fullText, 'utf-8'));
    } catch {
      // Graceful fallback to buffer text parsing
      return this.extractFromText(buffer);
    }
  }

  /**
   * PPTX extraction (PKZIP archive parsing of ppt/slides/slide*.xml)
   */
  private async extractFromPptx(buffer: Buffer): Promise<{ pageNumber: number; text: string }[]> {
    const pages: { pageNumber: number; text: string }[] = [];
    try {
      // Find slide XML entries
      let slideIndex = 1;
      while (slideIndex <= 100) {
        const entryName = `ppt/slides/slide${slideIndex}.xml`;
        const slideXml = await this.extractZipEntry(buffer, entryName);
        if (!slideXml) break;

        const textMatches = slideXml.matchAll(/<a:t>([^<]*)<\/a:t>/g);
        const slideTexts: string[] = [];
        for (const m of textMatches) {
          if (m[1].trim()) slideTexts.push(m[1].trim());
        }

        if (slideTexts.length > 0) {
          pages.push({
            pageNumber: slideIndex,
            text: `Slide ${slideIndex}: ${slideTexts.join(' ')}`,
          });
        }
        slideIndex++;
      }
    } catch {
      // Ignore zip errors, proceed with whatever slides found
    }

    if (pages.length === 0) {
      return this.extractFromText(buffer);
    }
    return pages;
  }

  /**
   * PDF text extraction
   * Parses PDF streams, flate-compressed data, text operators (BT ... ET, Tj, TJ)
   */
  private async extractFromPdf(buffer: Buffer): Promise<{ pageNumber: number; text: string }[]> {
    const bufferStr = buffer.toString('binary');
    const pages: { pageNumber: number; text: string }[] = [];

    // Check PDF magic header
    if (!bufferStr.startsWith('%PDF-')) {
      throw new Error('Corrupted or invalid PDF file header');
    }

    // Match page objects and stream text blocks
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let streamMatch;
    let rawTexts: string[] = [];

    while ((streamMatch = streamRegex.exec(bufferStr)) !== null) {
      const streamData = Buffer.from(streamMatch[1], 'binary');
      let decompressed: string | null = null;

      try {
        decompressed = zlib.inflateSync(streamData).toString('utf-8');
      } catch {
        try {
          decompressed = zlib.inflateRawSync(streamData).toString('utf-8');
        } catch {
          decompressed = streamData.toString('utf-8');
        }
      }

      if (decompressed) {
        // Extract text from text display operators (Tj / TJ / ' / ")
        const textOperatorRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
        let opMatch;
        let blockText: string[] = [];
        while ((opMatch = textOperatorRegex.exec(decompressed)) !== null) {
          blockText.push(opMatch[1]);
        }

        // TJ array syntax: [ (Text) -20 (More text) ] TJ
        const tjArrayRegex = /\[((?:\([^)]*\)|[0-9.-]+|\s*)+)\]\s*TJ/g;
        let tjMatch;
        while ((tjMatch = tjArrayRegex.exec(decompressed)) !== null) {
          const innerParenRegex = /\(([^)]*)\)/g;
          let inner;
          while ((inner = innerParenRegex.exec(tjMatch[1])) !== null) {
            blockText.push(inner[1]);
          }
        }

        if (blockText.length > 0) {
          rawTexts.push(blockText.join(' '));
        }
      }
    }

    // Determine estimated page count from /Count \d+ or page stream chunks
    let pageCount = 1;
    const pageCountMatch = bufferStr.match(/\/Count\s+(\d+)/);
    if (pageCountMatch && parseInt(pageCountMatch[1], 10) > 0) {
      pageCount = parseInt(pageCountMatch[1], 10);
    } else {
      const pageObjs = bufferStr.match(/\/Type\s*\/Page[^s]/g);
      if (pageObjs && pageObjs.length > 0) {
        pageCount = pageObjs.length;
      }
    }

    if (rawTexts.length === 0) {
      // Fallback: extract ASCII words from buffer directly
      const asciiMatches = bufferStr.match(/[A-Za-z0-9,.:;?!'\-"() ]{5,}/g);
      if (asciiMatches && asciiMatches.length > 0) {
        rawTexts = [asciiMatches.join(' ')];
      } else {
        throw new Error('Unable to parse text streams from PDF.');
      }
    }

    const aggregated = rawTexts.join('\n\n');
    const chunkSize = Math.max(1000, Math.ceil(aggregated.length / pageCount));

    for (let i = 0; i < pageCount; i++) {
      const slice = aggregated.slice(i * chunkSize, (i + 1) * chunkSize);
      if (slice.trim()) {
        pages.push({
          pageNumber: i + 1,
          text: slice,
        });
      }
    }

    return pages.length > 0 ? pages : [{ pageNumber: 1, text: aggregated }];
  }

  /**
   * Pure Node.js ZIP entry extractor using central directory and local headers
   */
  private async extractZipEntry(zipBuffer: Buffer, targetEntryName: string): Promise<string | null> {
    try {
      // Find ZIP local file headers (0x04034b50)
      let offset = 0;
      while (offset < zipBuffer.length - 30) {
        if (zipBuffer.readUInt32LE(offset) === 0x04034b50) {
          const compressionMethod = zipBuffer.readUInt16LE(offset + 8);
          const compressedSize = zipBuffer.readUInt32LE(offset + 18);
          const fileNameLength = zipBuffer.readUInt16LE(offset + 26);
          const extraFieldLength = zipBuffer.readUInt16LE(offset + 28);

          const fileName = zipBuffer.toString('utf-8', offset + 30, offset + 30 + fileNameLength);
          const dataOffset = offset + 30 + fileNameLength + extraFieldLength;

          if (fileName === targetEntryName && dataOffset + compressedSize <= zipBuffer.length) {
            const compressedData = zipBuffer.subarray(dataOffset, dataOffset + compressedSize);
            if (compressionMethod === 0) {
              return compressedData.toString('utf-8');
            } else if (compressionMethod === 8) {
              return zlib.inflateRawSync(compressedData).toString('utf-8');
            }
          }

          offset = dataOffset + compressedSize;
        } else {
          offset++;
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  /**
   * Structure Detection & Chunking
   * Segments into 500-800 token chunks with 100 token overlap.
   * Extracts chapter and section headings.
   */
  private structureAndChunk(pages: { pageNumber: number; text: string }[]): ExtractionResult {
    const chunks: ExtractedChunk[] = [];
    const detectedChapters: string[] = [];
    let currentChapter = 'General';
    let currentSection = 'Overview';
    let currentHeading = '';

    let totalWords = 0;
    let totalChars = 0;
    let chunkCounter = 0;

    // Target tokens per chunk: ~500-800 tokens (~2000-3200 characters)
    const TARGET_CHUNK_CHARS = 2400;
    const OVERLAP_CHARS = 400;

    for (const page of pages) {
      const cleaned = this.cleanText(page.text);
      if (!cleaned) continue;

      totalChars += cleaned.length;
      totalWords += cleaned.split(/\s+/).filter(Boolean).length;

      // Detect chapters and headings
      const lines = cleaned.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        const chapterMatch = trimmed.match(/^(?:#{1,6}\s+)?(?:Chapter|Unit|Module|Part)\s+(\d+[:\-]?\s*.*)/i);
        if (chapterMatch) {
          const chName = chapterMatch[0].replace(/^#+\s*/, '').trim();
          currentChapter = chName;
          if (!detectedChapters.includes(currentChapter)) {
            detectedChapters.push(currentChapter);
          }
        }
        const headingMatch = trimmed.match(/^(?:#{1,6}\s+|Section\s+\d+[:\.]?\s*)(.+)/i);
        if (headingMatch) {
          const hName = headingMatch[1].replace(/^#+\s*/, '').trim();
          currentSection = hName;
          currentHeading = hName;
        }
      }

      // Break page content into semantic paragraphs
      const paragraphs = cleaned.split(/\n\s*\n/);
      let buffer = '';

      for (const p of paragraphs) {
        const pClean = p.trim();
        if (!pClean) continue;

        if ((buffer + '\n\n' + pClean).length > TARGET_CHUNK_CHARS) {
          if (buffer.trim()) {
            chunks.push({
              chunkIndex: chunkCounter++,
              pageNumber: page.pageNumber,
              chapter: currentChapter,
              section: currentSection,
              heading: currentHeading || currentSection,
              text: buffer.trim(),
              tokensCount: this.estimateTokens(buffer.trim()),
            });

            // Keep overlap from end of previous chunk
            const overlapSlice = buffer.slice(-OVERLAP_CHARS);
            buffer = overlapSlice + '\n\n' + pClean;
          } else {
            buffer = pClean;
          }
        } else {
          buffer = buffer ? buffer + '\n\n' + pClean : pClean;
        }
      }

      if (buffer.trim()) {
        chunks.push({
          chunkIndex: chunkCounter++,
          pageNumber: page.pageNumber,
          chapter: currentChapter,
          section: currentSection,
          heading: currentHeading || currentSection,
          text: buffer.trim(),
          tokensCount: this.estimateTokens(buffer.trim()),
        });
      }
    }

    return {
      pageCount: pages.length,
      wordCount: totalWords,
      characterCount: totalChars,
      detectedChapters,
      chunks,
    };
  }
}

let extractorInstance: ExtractorService | null = null;
export function getExtractorService(): ExtractorService {
  if (!extractorInstance) {
    extractorInstance = new ExtractorService();
  }
  return extractorInstance;
}
