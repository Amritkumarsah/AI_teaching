"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Sparkles, RefreshCw, Volume2, ShieldCheck, X } from "lucide-react";

interface StudentFollowUpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conceptTitle: string;
  docId: string | null;
  language: string;
  onPlayAudioResponse: (audioUrl: string) => void;
  onOpenQuiz?: () => void;
}

export const StudentFollowUpDrawer: React.FC<StudentFollowUpDrawerProps> = ({
  isOpen,
  onClose,
  conceptTitle,
  docId,
  language,
  onPlayAudioResponse,
  onOpenQuiz
}) => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<
    Array<{
      sender: "student" | "teacher";
      text: string;
      audioUrl?: string;
      citations?: any[];
    }>
  >([
    {
      sender: "teacher",
      text: "Have any questions about this concept? Ask me anything! I am grounded in your uploaded textbook and will answer in your selected language without disrupting your lesson."
    }
  ]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!question.trim() || loading) return;

    const userText = question.trim();
    setQuestion("");
    setConversation((prev) => [...prev, { sender: "student", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/ask-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userText,
          concept_title: conceptTitle,
          doc_id: docId,
          language: language,
          level: "beginner"
        })
      });

      const data = await res.json();
      setConversation((prev) => [
        ...prev,
        {
          sender: "teacher",
          text: data.answer_text,
          audioUrl: data.audio_url,
          citations: data.citations
        }
      ]);

      if (data.audio_url) {
        onPlayAudioResponse(`http://localhost:8000${data.audio_url}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900/95 border-l border-slate-700/80 backdrop-blur-xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-indigo-500/20 text-cyan-400 rounded-xl border border-indigo-500/30">
            <MessageSquare className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Live Q&A with Dr. Arya</h3>
            <p className="text-[11px] text-slate-400">Context: {conceptTitle}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 10-Question Quiz Banner */}
      {onOpenQuiz && (
        <div className="mx-4 mt-3 p-3.5 bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-slate-900 border border-indigo-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-lg shadow-indigo-500/10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-tr from-amber-500/20 to-indigo-500/30 text-amber-300 rounded-xl border border-amber-500/40">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                10-Question Quiz
                <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-300 rounded-full font-mono">10 MCQs</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Test your mastery on this concept!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenQuiz();
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            Start Quiz 🎯
          </button>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {conversation.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.sender === "student" ? "items-end" : "items-start"}`}
          >
            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[88%] ${
                msg.sender === "student"
                  ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-br-xs"
                  : "bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-xs"
              }`}
            >
              <p>{msg.text}</p>

              {msg.audioUrl && (
                <button
                  onClick={() => onPlayAudioResponse(`http://localhost:8000${msg.audioUrl}`)}
                  className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-cyan-300 rounded-lg text-[10px] font-semibold border border-indigo-500/30 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" />
                  Listen to Teacher Voice
                </button>
              )}

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1 text-cyan-400 font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    Grounded Source Citations:
                  </div>
                  {msg.citations.map((c: any, i: number) => (
                    <div key={i} className="font-mono text-slate-400 truncate">
                      • {c.source_file} (p. {c.page})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Dr. Arya is analyzing course context & formulating answer...</span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask a question about this concept..."
            className="flex-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sans"
          />
          <button
            onClick={handleSend}
            disabled={!question.trim() || loading}
            className="p-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
