import mongoose, { Schema, Document } from 'mongoose';

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

export interface IDocumentMetadata {
  title?: string;
  author?: string;
  wordCount?: number;
  characterCount?: number;
  detectedChapters?: string[];
  processingError?: string;
  processingDurationMs?: number;
}

export interface IDocumentDocument extends Document {
  documentId: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  storagePath: string;
  pageCount: number;
  metadata: IDocumentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocumentDocument>(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['UPLOADED', 'PROCESSING', 'READY', 'FAILED'],
      default: 'UPLOADED',
      index: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    pageCount: {
      type: Number,
      default: 1,
    },
    metadata: {
      title: { type: String },
      author: { type: String },
      wordCount: { type: Number, default: 0 },
      characterCount: { type: Number, default: 0 },
      detectedChapters: [{ type: String }],
      processingError: { type: String },
      processingDurationMs: { type: Number },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Compound index for efficient user document querying
DocumentSchema.index({ userId: 1, createdAt: -1 });

export const DocumentModel =
  (mongoose.models.Document as mongoose.Model<IDocumentDocument>) ||
  mongoose.model<IDocumentDocument>('Document', DocumentSchema);

// DocumentChunk Model
export interface IDocumentChunkDocument extends Document {
  documentId: string;
  chunkIndex: number;
  pageNumber: number;
  chapter?: string;
  section?: string;
  heading?: string;
  text: string;
  tokensCount: number;
  createdAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunkDocument>(
  {
    documentId: {
      type: String,
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    chapter: {
      type: String,
      default: '',
    },
    section: {
      type: String,
      default: '',
    },
    heading: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      required: true,
    },
    tokensCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

DocumentChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });
DocumentChunkSchema.index({ text: 'text', heading: 'text', section: 'text' });

export const DocumentChunkModel =
  (mongoose.models.DocumentChunk as mongoose.Model<IDocumentChunkDocument>) ||
  mongoose.model<IDocumentChunkDocument>('DocumentChunk', DocumentChunkSchema);
