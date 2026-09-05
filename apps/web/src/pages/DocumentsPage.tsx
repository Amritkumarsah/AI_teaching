import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuthStore } from '../store/authStore';
import {
  UploadCloud,
  FileText,
  BookOpen,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  ExternalLink,
  Layers,
  FileSpreadsheet,
  FileCode,
  FileQuestion,
  FileArchive,
} from 'lucide-react';

export interface DocumentItem {
  _id?: string;
  documentId: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
  storagePath: string;
  pageCount: number;
  metadata?: {
    title?: string;
    wordCount?: number;
    characterCount?: number;
    detectedChapters?: string[];
    processingError?: string;
    processingDurationMs?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChunkItem {
  _id: string;
  documentId: string;
  chunkIndex: number;
  pageNumber?: number;
  chapter?: string;
  section?: string;
  heading?: string;
  text: string;
  tokensCount?: number;
}

export const DocumentsPage: React.FC = () => {
  const { addToast } = useToast();
  const { token, isAuthenticated } = useAuthStore();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Selected document for chunk inspection modal
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [docChunks, setDocChunks] = useState<ChunkItem[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState<boolean>(false);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState<boolean>(false);

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  const getFormatIcon = (filename: string, mimeType: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf' || mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-400" />;
    }
    if (ext === 'doc' || ext === 'docx' || mimeType.includes('word')) {
      return <FileText className="w-5 h-5 text-sky-400" />;
    }
    if (ext === 'ppt' || ext === 'pptx' || mimeType.includes('presentation')) {
      return <FileSpreadsheet className="w-5 h-5 text-amber-400" />;
    }
    if (ext === 'txt' || ext === 'md' || mimeType.includes('text/')) {
      return <FileCode className="w-5 h-5 text-emerald-400" />;
    }
    return <FileQuestion className="w-5 h-5 text-slate-400" />;
  };

  const getStatusBadge = (status: DocumentItem['status'], errorMsg?: string) => {
    switch (status) {
      case 'READY':
        return (
          <Badge variant="success" dot className="px-2.5 py-1 text-xs">
            Ready for RAG
          </Badge>
        );
      case 'PROCESSING':
      case 'UPLOADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case 'FAILED':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"
            title={errorMsg || 'Text extraction failed'}
          >
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Load documents from server
  const loadDocuments = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/documents', { credentials: 'include', headers });
      const json = await res.json();

      if (json.success && json.data?.documents) {
        setDocuments(json.data.documents);
      }
    } catch {
      // Offline fallback: keep current documents
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Background polling: if any doc is PROCESSING or UPLOADED, poll every 2.5s
  useEffect(() => {
    const hasProcessing = documents.some(
      (d) => d.status === 'PROCESSING' || d.status === 'UPLOADED'
    );
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      loadDocuments(true);
    }, 2500);

    return () => clearInterval(interval);
  }, [documents, loadDocuments]);

  // Handle File Upload
  const handleUploadFile = async (file: File) => {
    // 1. Client-side extension validation
    const allowedExts = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'md'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExts.includes(ext)) {
      addToast({
        type: 'error',
        title: 'Unsupported File Type',
        message: `.${ext.toUpperCase()} files are not supported. Please upload PDF, DOC, DOCX, PPT, PPTX, TXT, or MD.`,
      });
      return;
    }

    // 2. Client-side size limit validation (50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        message: `File size (${formatFileSize(file.size)}) exceeds the 50MB limit.`,
      });
      return;
    }

    if (file.size === 0) {
      addToast({
        type: 'error',
        title: 'Empty File',
        message: 'The selected file is empty (0 bytes).',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      setUploadProgress(50);
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      setUploadProgress(90);
      const json = await res.json();

      if (res.status === 202 && json.success) {
        addToast({
          type: 'success',
          title: 'Document Uploaded',
          message: `${file.name} uploaded. Background text extraction & chunking in progress.`,
        });

        // Add optimistic document to list
        const optimisticDoc: DocumentItem = {
          documentId: json.data.documentId,
          userId: 'current',
          filename: json.data.filename,
          originalName: json.data.originalName,
          mimeType: json.data.mimeType,
          size: json.data.size,
          status: 'PROCESSING',
          storagePath: 'local',
          pageCount: 1,
          metadata: {
            title: file.name,
            wordCount: 0,
            characterCount: 0,
            detectedChapters: [],
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setDocuments((prev) => [optimisticDoc, ...prev.filter((d) => d.documentId !== optimisticDoc.documentId)]);
        loadDocuments(true);
      } else {
        addToast({
          type: 'error',
          title: 'Upload Failed',
          message: json.error?.message || 'Server rejected document upload.',
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Could not upload document. Please check connection.',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  // Delete Document
  const handleDelete = async (docId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This removes all extracted chunks from storage.`)) {
      return;
    }

    setDeletingId(docId);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setDocuments((prev) => prev.filter((d) => d.documentId !== docId));
        addToast({
          type: 'warning',
          title: 'Document Removed',
          message: `"${name}" and all associated chunks were deleted.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Delete Failed',
          message: json.error?.message || 'Failed to delete document.',
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Network error deleting document.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Retry Failed Document Processing
  const handleRetry = async (docId: string, name: string) => {
    setRetryingId(docId);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/documents/${docId}/retry`, {
        method: 'POST',
        headers,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setDocuments((prev) =>
          prev.map((d) => (d.documentId === docId ? { ...d, status: 'PROCESSING' } : d))
        );
        addToast({
          type: 'info',
          title: 'Retry Enqueued',
          message: `Re-processing "${name}" in background...`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Retry Failed',
          message: json.error?.message || 'Could not retry processing.',
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Network error triggering retry.',
      });
    } finally {
      setRetryingId(null);
    }
  };

  // Open Document & Inspect Chunks
  const handleOpenInspect = async (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setIsInspectModalOpen(true);
    setIsLoadingChunks(true);

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/documents/${doc.documentId}`, { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setSelectedDoc(json.data.document);
        setDocChunks(json.data.chunks || []);
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Error Loading Details',
        message: 'Unable to fetch extracted chunks for this document.',
      });
    } finally {
      setIsLoadingChunks(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-sky-400" />
            Document Library
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload educational textbooks, lecture slides, papers, or notes for non-blocking extraction and RAG preparation.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => loadDocuments()}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="self-start sm:self-auto"
        >
          Refresh Library
        </Button>
      </div>

      {/* Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/5 ring-4 ring-indigo-500/20'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 sm:p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-white mb-1">
            {isUploading ? 'Uploading & Enqueuing Processing...' : 'Upload Learning Material'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            Drag & drop or select documents to extract structure and chunk for RAG.
            <br />
            <span className="text-slate-300 font-medium">Supported:</span> PDF, DOC, DOCX, PPT, PPTX, TXT, MD (Up to 50MB).
          </p>

          <label className="cursor-pointer">
            <Button
              variant="primary"
              size="md"
              isLoading={isUploading}
              leftIcon={<UploadCloud className="w-4 h-4" />}
            >
              Select File to Ingest
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleUploadFile(e.target.files[0]);
                }
              }}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
            />
          </label>

          {isUploading && (
            <div className="w-full max-w-xs mt-4">
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Uploading to storage provider...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Library Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Uploaded Documents ({documents.length})
          </h2>
        </div>

        {documents.length === 0 && !isLoading ? (
          <EmptyState
            title="No documents ingested yet"
            description="Upload textbook chapters, syllabi, or notes above to inspect extracted chapters and chunks."
          />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4 sm:px-6">Document Name</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Type</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Size</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">Upload Date</th>
                    <th className="py-3.5 px-4">Processing Status</th>
                    <th className="py-3.5 px-4 hidden xl:table-cell">Chapters / Pages</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {documents.map((doc) => {
                    const ext = doc.originalName?.split('.').pop()?.toUpperCase() || 'FILE';
                    const chaptersCount = doc.metadata?.detectedChapters?.length || 0;

                    return (
                      <tr
                        key={doc.documentId}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Filename & Icon */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0">
                              {getFormatIcon(doc.originalName, doc.mimeType)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-white truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
                                {doc.originalName || doc.filename}
                              </div>
                              <div className="text-xs text-slate-400 sm:hidden">
                                {ext} • {formatFileSize(doc.size)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-4 px-4 hidden sm:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {ext}
                          </span>
                        </td>

                        {/* Size */}
                        <td className="py-4 px-4 hidden md:table-cell text-xs text-slate-300 font-mono">
                          {formatFileSize(doc.size)}
                        </td>

                        {/* Upload Date */}
                        <td className="py-4 px-4 hidden lg:table-cell text-xs text-slate-400">
                          {formatDate(doc.createdAt)}
                        </td>

                        {/* Processing Status */}
                        <td className="py-4 px-4">
                          {getStatusBadge(doc.status, doc.metadata?.processingError)}
                        </td>

                        {/* Chapters / Pages */}
                        <td className="py-4 px-4 hidden xl:table-cell text-xs text-slate-300">
                          {doc.status === 'READY' ? (
                            <span>
                              {chaptersCount > 0 ? `${chaptersCount} Chapters • ` : ''}
                              {doc.pageCount || 1} Pages
                              {doc.metadata?.wordCount ? ` (${doc.metadata.wordCount} words)` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        {/* Actions: Open, Retry, Delete */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Open / Inspect */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenInspect(doc)}
                              disabled={doc.status === 'PROCESSING' || doc.status === 'UPLOADED'}
                              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                              className="text-xs px-2.5"
                            >
                              Open
                            </Button>

                            {/* Retry (if failed) */}
                            {doc.status === 'FAILED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRetry(doc.documentId, doc.originalName)}
                                isLoading={retryingId === doc.documentId}
                                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                                className="text-xs px-2 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                                title="Retry background processing"
                              >
                                Retry
                              </Button>
                            )}

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(doc.documentId, doc.originalName)}
                              isLoading={deletingId === doc.documentId}
                              className="text-slate-400 hover:text-rose-400 p-2"
                              title="Delete document and chunks"
                              aria-label="Delete document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Document Modal */}
      {selectedDoc && (
        <Modal
          isOpen={isInspectModalOpen}
          onClose={() => setIsInspectModalOpen(false)}
          title={selectedDoc.originalName}
          description={`ID: ${selectedDoc.documentId} • ${formatFileSize(selectedDoc.size)} • ${selectedDoc.mimeType}`}
          maxWidth="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-400">
                Extracted for Semantic Grounding (Phase 3 Ready)
              </span>
              <Button variant="secondary" size="sm" onClick={() => setIsInspectModalOpen(false)}>
                Close Viewer
              </Button>
            </div>
          }
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            {/* Metadata Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Status
                </span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {selectedDoc.status}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Pages
                </span>
                <span className="text-sm font-bold text-white">
                  {selectedDoc.pageCount || 1}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Words / Tokens
                </span>
                <span className="text-sm font-bold text-white">
                  {selectedDoc.metadata?.wordCount || 0} words
                </span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Semantic Chunks
                </span>
                <span className="text-sm font-bold text-indigo-400">
                  {docChunks.length} chunks
                </span>
              </div>
            </div>

            {/* Detected Chapters */}
            {selectedDoc.metadata?.detectedChapters && selectedDoc.metadata.detectedChapters.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  Detected Chapters & Units
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDoc.metadata.detectedChapters.map((ch, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Chunks List */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Prepared RAG Chunks ({docChunks.length})
              </h4>

              {isLoadingChunks ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Loading extracted semantic chunks...
                </div>
              ) : docChunks.length === 0 ? (
                <div className="p-6 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
                  No chunks generated for this document.
                </div>
              ) : (
                <div className="space-y-3">
                  {docChunks.map((chunk) => (
                    <div
                      key={chunk._id}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
                        <span className="font-semibold text-sky-400">
                          Chunk #{chunk.chunkIndex + 1}
                          {chunk.heading ? ` • ${chunk.heading}` : ''}
                        </span>
                        <div className="flex items-center gap-3">
                          <span>Page {chunk.pageNumber || 1}</span>
                          <span className="text-indigo-400 font-mono">
                            ~{chunk.tokensCount || 0} tokens
                          </span>
                        </div>
                      </div>

                      {chunk.chapter && chunk.chapter !== 'General' && (
                        <div className="text-[11px] text-slate-400 font-medium">
                          {chunk.chapter}
                          {chunk.section ? ` › ${chunk.section}` : ''}
                        </div>
                      )}

                      <p className="text-slate-300 leading-relaxed font-mono text-[12px] bg-slate-900/80 p-3 rounded-lg border border-slate-800/60 whitespace-pre-wrap">
                        {chunk.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
