import { DocumentModel, DocumentChunkModel } from '../../models/document.model';
import { getStorageProvider } from '../storage/storage.provider';
import { getExtractorService } from '../extractor/extractor.service';

export class IngestionWorker {
  /**
   * Processes a document asynchronously:
   * 1. Sets status to PROCESSING
   * 2. Retrieves file buffer from storage provider
   * 3. Extracts text, structure, and semantic chunks
   * 4. Persists DocumentChunks in MongoDB
   * 5. Updates Document status to READY (or FAILED on error)
   */
  public async processDocument(documentId: string): Promise<void> {
    const startTime = Date.now();
    const storageProvider = getStorageProvider();
    const extractor = getExtractorService();

    try {
      const doc = await DocumentModel.findOne({ documentId });
      if (!doc) {
        console.error(`[IngestionWorker] Document not found: ${documentId}`);
        return;
      }

      // Mark status as PROCESSING
      doc.status = 'PROCESSING';
      await doc.save();

      // Read file buffer from StorageProvider
      const fileBuffer = await storageProvider.getFileBuffer(doc.storagePath);

      // Perform text extraction, structure detection, and chunking
      const extraction = await extractor.extract(fileBuffer, doc.originalName, doc.mimeType);

      // Remove any prior chunks if this is a retry
      await DocumentChunkModel.deleteMany({ documentId });

      // Save extracted chunks in bulk
      if (extraction.chunks.length > 0) {
        const chunkDocs = extraction.chunks.map((c) => ({
          documentId,
          chunkIndex: c.chunkIndex,
          pageNumber: c.pageNumber,
          chapter: c.chapter || 'General',
          section: c.section || 'Overview',
          heading: c.heading || '',
          text: c.text,
          tokensCount: c.tokensCount,
        }));
        await DocumentChunkModel.insertMany(chunkDocs);
      }

      // Mark document as READY with comprehensive metadata
      doc.status = 'READY';
      doc.pageCount = extraction.pageCount;
      doc.metadata = {
        ...doc.metadata,
        wordCount: extraction.wordCount,
        characterCount: extraction.characterCount,
        detectedChapters: extraction.detectedChapters,
        processingDurationMs: Date.now() - startTime,
        processingError: undefined,
      };
      await doc.save();

      console.log(
        `[IngestionWorker] Document ${doc.documentId} processed successfully: ${extraction.pageCount} pages, ${extraction.chunks.length} chunks (${Date.now() - startTime}ms)`
      );
    } catch (error: any) {
      console.error(`[IngestionWorker] Processing failed for document ${documentId}:`, error.message);

      await DocumentModel.updateOne(
        { documentId },
        {
          $set: {
            status: 'FAILED',
            'metadata.processingError': error.message || 'Text extraction failed',
            'metadata.processingDurationMs': Date.now() - startTime,
          },
        }
      ).catch(() => null);
    }
  }

  /**
   * Dispatches document processing asynchronously without blocking callers
   */
  public dispatch(documentId: string): void {
    setImmediate(() => {
      this.processDocument(documentId).catch((err) => {
        console.error(`[IngestionWorker] Unhandled dispatch error:`, err);
      });
    });
  }

  /**
   * Retries processing a failed document
   */
  public async retry(documentId: string, userId: string): Promise<boolean> {
    const doc = await DocumentModel.findOne({ documentId, userId });
    if (!doc) return false;

    doc.status = 'PROCESSING';
    await doc.save();

    this.dispatch(documentId);
    return true;
  }
}

let workerInstance: IngestionWorker | null = null;
export function getIngestionWorker(): IngestionWorker {
  if (!workerInstance) {
    workerInstance = new IngestionWorker();
  }
  return workerInstance;
}
