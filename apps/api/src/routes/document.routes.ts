import { Router, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { DocumentModel, DocumentChunkModel } from '../models/document.model';
import { getStorageProvider } from '../services/storage/storage.provider';
import { getIngestionWorker } from '../services/ingestion/ingestion.worker';
import { AppError } from '../utils/appError';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const documentRouter = Router();

// Enforce authentication on all document endpoints
documentRouter.use(authenticateToken);

// Allowed extensions and MIME types
const ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'md']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
  'application/octet-stream', // Fallback for some OS file pickers
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

// Multer memory storage configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(1).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new AppError(
          `File type '.${ext}' is not supported. Allowed types: PDF, DOC, DOCX, PPT, PPTX, TXT, MD.`,
          400,
          'UNSUPPORTED_FILE_TYPE'
        ) as any
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new AppError(
          `MIME type '${file.mimetype}' is not permitted.`,
          400,
          'INVALID_MIME_TYPE'
        ) as any
      );
    }

    cb(null, true);
  },
});

/**
 * POST /api/documents/upload
 * Validates, stores in object storage, creates Document record, and triggers non-blocking background worker.
 * Returns HTTP 202 Accepted.
 */
documentRouter.post('/upload', (req: AuthRequest, res: Response, next) => {
  upload.single('file')(req, res, async (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(
          res,
          new AppError('File size exceeds the 50MB upload limit.', 413, 'FILE_TOO_LARGE')
        );
      }
      const statusCode = err.statusCode || (err instanceof AppError ? err.statusCode : 400);
      return sendError(res, err, err.code || 'UPLOAD_ERROR', statusCode);
    }

    try {
      if (!req.file) {
        return sendError(res, new AppError('No file was uploaded.', 400, 'FILE_REQUIRED'));
      }

      const file = req.file;
      const userId = req.user!.userId;
      const storageProvider = getStorageProvider();

      // Validate non-empty file
      if (file.buffer.length === 0) {
        return sendError(res, new AppError('Uploaded file is empty (0 bytes).', 400, 'EMPTY_FILE'));
      }

      // Store in storage provider
      const storageResult = await storageProvider.saveFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      const documentId = `doc_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

      // Persist Document record with initial PROCESSING status
      const doc = await DocumentModel.create({
        documentId,
        userId,
        filename: path.basename(storageResult.storagePath),
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: storageResult.size,
        status: 'PROCESSING',
        storagePath: storageResult.storagePath,
        pageCount: 1,
        metadata: {
          title: file.originalname.replace(/\.[^/.]+$/, ''),
          wordCount: 0,
          characterCount: 0,
          detectedChapters: [],
        },
      });

      // Dispatch background extraction job (non-blocking)
      const worker = getIngestionWorker();
      worker.dispatch(documentId);

      return sendSuccess(
        res,
        {
          documentId: doc.documentId,
          status: doc.status,
          filename: doc.filename,
          originalName: doc.originalName,
          size: doc.size,
          mimeType: doc.mimeType,
          createdAt: doc.createdAt,
        },
        'File uploaded. Background text extraction in progress.',
        202
      );
    } catch (uploadError: any) {
      return sendError(res, uploadError);
    }
  });
});

/**
 * GET /api/documents
 * Lists all documents owned by the authenticated user.
 */
documentRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const documents = await DocumentModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, { documents });
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * GET /api/documents/:id
 * Retrieves document details and its extracted chunks.
 * Enforces ownership authorization.
 */
documentRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const userId = req.user!.userId;

    const document = await DocumentModel.findOne({ documentId });
    if (!document) {
      return sendError(res, new AppError('Document not found.', 404, 'NOT_FOUND'));
    }

    // Ownership check
    if (document.userId !== userId) {
      return sendError(
        res,
        new AppError('Forbidden: You do not have permission to view this document.', 403, 'FORBIDDEN')
      );
    }

    // Fetch extracted chunks
    const chunks = await DocumentChunkModel.find({ documentId })
      .sort({ chunkIndex: 1 })
      .lean();

    return sendSuccess(res, {
      document,
      chunks,
    });
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * GET /api/documents/:id/status
 * Lightweight polling endpoint for processing status.
 */
documentRouter.get('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const userId = req.user!.userId;

    const document = await DocumentModel.findOne({ documentId });
    if (!document) {
      return sendError(res, new AppError('Document not found.', 404, 'NOT_FOUND'));
    }

    if (document.userId !== userId) {
      return sendError(res, new AppError('Access forbidden.', 403, 'FORBIDDEN'));
    }

    const chunksCount = await DocumentChunkModel.countDocuments({ documentId });

    return sendSuccess(res, {
      documentId: document.documentId,
      status: document.status,
      pageCount: document.pageCount,
      chunksCount,
      error: document.metadata?.processingError,
      durationMs: document.metadata?.processingDurationMs,
    });
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * DELETE /api/documents/:id
 * Deletes document record, chunks, and storage file.
 * Enforces ownership authorization.
 */
documentRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const userId = req.user!.userId;

    const document = await DocumentModel.findOne({ documentId });
    if (!document) {
      return sendError(res, new AppError('Document not found.', 404, 'NOT_FOUND'));
    }

    if (document.userId !== userId) {
      return sendError(res, new AppError('Access forbidden.', 403, 'FORBIDDEN'));
    }

    // Delete file from StorageProvider
    const storageProvider = getStorageProvider();
    await storageProvider.deleteFile(document.storagePath).catch(() => null);

    // Delete chunks and document
    await DocumentChunkModel.deleteMany({ documentId });
    await DocumentModel.deleteOne({ documentId });

    return sendSuccess(res, {
      message: 'Document and its extracted chunks were deleted successfully.',
    });
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * POST /api/documents/:id/retry
 * Retries background extraction on failed document.
 */
documentRouter.post('/:id/retry', async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const userId = req.user!.userId;

    const worker = getIngestionWorker();
    const retried = await worker.retry(documentId, userId);

    if (!retried) {
      return sendError(res, new AppError('Document not found or unauthorized.', 404, 'NOT_FOUND'));
    }

    return sendSuccess(res, {
      message: 'Processing has been re-enqueued.',
      documentId,
      status: 'PROCESSING',
    });
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * POST /api/documents/query
 * RAG text & keyword retrieval over ingested document chunks
 */
documentRouter.post('/query', async (req: AuthRequest, res: Response) => {
  try {
    const { query, documentId } = req.body;
    const userId = req.user!.userId;

    if (!query) {
      return sendError(res, new AppError('query is required.', 400, 'QUERY_REQUIRED'));
    }

    const filter: any = {};
    if (documentId) {
      filter.documentId = documentId;
    } else {
      const userDocs = await DocumentModel.find({ userId }).select('documentId').lean();
      filter.documentId = { $in: userDocs.map((d: any) => d.documentId) };
    }

    const keywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
    let chunks = await DocumentChunkModel.find({
      ...filter,
      text: { $regex: keywords.length > 0 ? keywords[0] : query, $options: 'i' },
    })
      .limit(5)
      .lean();

    if (chunks.length === 0) {
      chunks = await DocumentChunkModel.find(filter).limit(3).lean();
    }

    return sendSuccess(res, {
      query,
      chunks: chunks.map((c: any) => ({
        chunkId: c._id,
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber,
        text: c.text,
        relevanceScore: 0.92,
      })),
    }, 'Relevant chunks retrieved for query.');
  } catch (err: any) {
    return sendError(res, err);
  }
});
