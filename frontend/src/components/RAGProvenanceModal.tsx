"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  CheckCircle,
  ShieldCheck,
  Search,
  RefreshCw,
  Loader2,
  Sparkles,
  Info
} from "lucide-react";

interface RAGProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string | null;
  conceptTitle?: string;
  topic?: string;
  isGrounded?: boolean;
}

export const RAGProvenanceModal: React.FC<RAGProvenanceModalProps> = ({
  isOpen,
  onClose,
  docId,
  conceptTitle = "",
  topic = "",
  isGrounded = true
}) => {
  const [chunks, setChunks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [groundedStatus, setGroundedStatus] = useState<boolean>(isGrounded);
  const [activeDocId, setActiveDocId] = useState<string | null>(docId);

  const fetchProvenanceChunks = async (queryOverride?: string) => {
    setLoading(true);
    try {
      const q = queryOverride !== undefined ? queryOverride : (searchQuery || conceptTitle || topic || "");
      const params = new URLSearchParams();
      if (q) params.append("query", q);
      if (docId) params.append("doc_id", docId);
      params.append("top_k", "6");

      const res = await fetch(`http://localhost:8000/api/rag-provenance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setChunks(data.retrieved_chunks || []);
        setGroundedStatus(data.is_grounded ?? true);
        setActiveDocId(data.doc_id || docId);
      }
    } catch (e) {
      console.error("Failed to fetch real-time RAG provenance:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real-time chunks when modal opens or concept/docId changes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(conceptTitle || "");
      fetchProvenanceChunks(conceptTitle || "");
    }
  }, [isOpen, docId, conceptTitle]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProvenanceChunks();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[88vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500/30 to-cyan-500/30 text-cyan-400 border border-indigo-500/40 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                  Real-Time RAG Knowledge Grounding
                </span>
                <span className="px-2 py-0.2 bg-indigo-500/20 text-indigo-300 text-[10px] rounded-full font-mono border border-indigo-500/30">
                  Live Vector Store
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-200 truncate max-w-md">
                Verified Document Evidence & Provenance
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProvenanceChunks()}
              disabled={loading}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Refresh RAG provenance"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-Time Live Search Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 relative z-10">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search semantic chunks in uploaded document..."
                className="w-full pl-9.5 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-500/20 whitespace-nowrap"
            >
              {loading ? "Searching..." : "Search Chunks"}
            </button>
          </form>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
          {/* Grounding Status Header Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium ${
              groundedStatus
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                : "bg-amber-950/30 border-amber-500/40 text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <div>
                <div className="font-bold">
                  {groundedStatus
                    ? "Verified Grounded Mode: Real-Time Vector Retrieval Active"
                    : "General Knowledge Fallback Mode"}
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  {groundedStatus
                    ? `Retrieved direct evidence for: "${searchQuery || conceptTitle || topic || 'Current Concept'}"`
                    : "Operating on foundational principles with no external hallucination."}
                </div>
              </div>
            </div>
            <span className="font-mono text-[11px] px-2.5 py-1 bg-slate-950/80 rounded-lg border border-slate-700 shrink-0 text-cyan-300">
              {chunks.length} Chunks Retrieved
            </span>
          </div>

          {/* Explanation Callout */}
          <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>How this works:</strong> Dr. Arya never invents answers. When teaching or answering student doubts, our RAG vector pipeline tokenizes your uploaded document, computes TF-IDF cosine similarity scores, and retrieves only verified chunks to anchor the teacher's voice and whiteboard visuals.
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs text-slate-400">
                Retrieving live vector chunks from document store...
              </p>
            </div>
          ) : chunks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold">No semantic chunks matched this query.</p>
              <p className="text-[11px] text-slate-500">
                Try searching for a different keyword or view the overview chunks.
              </p>
            </div>
          ) : (
            /* Real-Time Chunk Cards */
            <div className="space-y-3">
              {chunks.map((chunk: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-950/70 border border-slate-800 hover:border-slate-700/90 rounded-2xl space-y-2.5 transition-all shadow-inner"
                >
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
                        <FileText className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-semibold text-slate-200 font-mono">
                        {chunk.source_file || activeDocId || "document.pdf"}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 text-[11px]">
                        Slide / Page {chunk.page_number || 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-950/80 text-indigo-300 rounded-lg font-mono text-[10px] border border-indigo-500/30">
                        Chunk: {chunk.chunk_id}
                      </span>
                      {chunk.relevance_score !== undefined && (
                        <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 rounded-lg font-mono text-[10px] border border-emerald-500/30">
                          Match: {chunk.relevance_score}
                        </span>
                      )}
                    </div>
                  </div>

                  {chunk.section_title && (
                    <div className="text-xs font-bold text-cyan-300">
                      Section / Heading: {chunk.section_title}
                    </div>
                  )}

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 font-serif">
                    "{chunk.text}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between relative z-10">
          <div className="text-[11px] text-slate-400 font-mono">
            Document ID: <span className="text-cyan-300">{activeDocId || "default"}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Provenance
          </button>
        </div>
      </div>
    </div>
  );
};
