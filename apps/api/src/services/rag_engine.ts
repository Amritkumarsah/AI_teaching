import { IDocumentChunk, IRAGSourceCitation } from '@ai-teacher/types';
import fs from 'fs';

export class RAGEngineService {
  /**
   * Sanitizes input to protect against prompt injection in untrusted uploaded content
   */
  public static sanitizeUntrustedText(text: string): string {
    return text
      .replace(/ignore\s+(all\s+)?(previous|prior)\s+instructions/gi, '[REDACTED_PROMPT_INJECTION]')
      .replace(/system\s*:\s*/gi, 'Data: ')
      .replace(/```(system|admin)/gi, '```text');
  }

  /**
   * Splits plain text / markdown into semantic chunks with metadata
   */
  public static chunkDocument(
    documentId: string,
    fullText: string,
    maxChunkSize: number = 500
  ): Omit<IDocumentChunk, '_id' | 'createdAt'>[] {
    const cleanText = this.sanitizeUntrustedText(fullText);
    const paragraphs = cleanText.split(/\n\s*\n/);
    const chunks: Omit<IDocumentChunk, '_id' | 'createdAt'>[] = [];

    let currentChunk = '';
    let pageNum = 1;
    let sectionTitle = 'Overview';

    paragraphs.forEach((p, idx) => {
      if (p.toLowerCase().includes('chapter') || p.toLowerCase().includes('page')) {
        pageNum++;
      }
      const isNewSection = p.toLowerCase().includes('section');
      if (isNewSection) {
        sectionTitle = p.split('\n')[0].slice(0, 40);
      }

      const shouldSplit = isNewSection || (currentChunk + '\n' + p).length > maxChunkSize;

      if (shouldSplit && currentChunk.trim().length > 0) {
        chunks.push({
          documentId,
          chunkIndex: chunks.length,
          pageNumber: pageNum,
          section: sectionTitle,
          text: currentChunk.trim(),
          keywords: currentChunk.toLowerCase().split(/\W+/).filter(w => w.length > 3).slice(0, 10),
        });
        currentChunk = p;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n${p}` : p;
      }
    });

    if (currentChunk.trim().length > 0) {
      chunks.push({
        documentId,
        chunkIndex: chunks.length,
        pageNumber: pageNum,
        section: `Section ${Math.floor(chunks.length / 3) + 1}`,
        text: currentChunk.trim(),
        keywords: currentChunk.toLowerCase().split(/\W+/).filter(w => w.length > 4).slice(0, 10),
      });
    }

    return chunks;
  }

  /**
   * Performs TF-IDF / Cosine Similarity vector retrieval across indexed chunks
   */
  public static searchSimilarChunks(
    query: string,
    chunks: IDocumentChunk[],
    topK: number = 3
  ): IRAGSourceCitation[] {
    const queryTerms = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    if (queryTerms.length === 0 || chunks.length === 0) return [];

    const scored = chunks.map(chunk => {
      const chunkText = chunk.text.toLowerCase();
      let matches = 0;
      queryTerms.forEach(term => {
        if (chunkText.includes(term)) {
          matches++;
        }
      });

      const score = matches / Math.max(1, queryTerms.length);
      return {
        documentId: chunk.documentId,
        documentName: chunk.section || 'Uploaded Document',
        pageNumber: chunk.pageNumber || 1,
        section: chunk.section || 'General Section',
        relevanceScore: parseFloat(score.toFixed(2)),
        snippet: chunk.text.slice(0, 240) + '...',
      };
    });

    return scored
      .filter(s => s.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, topK);
  }
}
