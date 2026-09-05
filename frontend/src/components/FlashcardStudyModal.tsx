"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  BookOpen,
  Award
} from "lucide-react";

interface Flashcard {
  id: number;
  category: string;
  front: string;
  back: string;
  formula?: string;
  memory_hook?: string;
}

interface FlashcardStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: string;
  level?: string;
}

export const FlashcardStudyModal: React.FC<FlashcardStudyModalProps> = ({
  isOpen,
  onClose,
  topic = "physics",
  level = "basic"
}) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredCount, setMasteredCount] = useState<number>(0);
  const [reviewedCards, setReviewedCards] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetch(`http://localhost:8000/api/flashcards?topic=${encodeURIComponent(topic)}&level=${level}`)
      .then((res) => res.json())
      .then((data) => {
        setCards(data.flashcards || []);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching flashcards:", err);
        setIsLoading(false);
      });
  }, [isOpen, topic, level]);

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0;

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const markMastered = () => {
    if (!reviewedCards.includes(currentIndex)) {
      setReviewedCards((prev) => [...prev, currentIndex]);
      setMasteredCount((prev) => prev + 1);
    }
    handleNext();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>3D Spaced-Repetition Flashcards</span>
                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-mono">
                  ACTIVE RECALL
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Flip cards to test memory retention before your exam • {topic}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span className="text-emerald-400 font-bold">
            ✓ Mastered: {masteredCount}/{cards.length}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Flashcard 3D Stage */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[320px]">
          {isLoading ? (
            <div className="text-sm font-mono text-cyan-400 flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4" /> Generating active recall cards...
            </div>
          ) : currentCard ? (
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative w-full max-w-lg min-h-[260px] p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/40 shadow-2xl flex flex-col justify-between cursor-pointer transform transition-all duration-300 hover:scale-[1.01] hover:border-cyan-400"
            >
              {/* Category Badge & Flip Prompt */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold uppercase">
                  {currentCard.category}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <RotateCw className="w-3 h-3 text-cyan-400 animate-spin" /> Click to flip
                </span>
              </div>

              {/* Card Body (Front vs Back) */}
              <div className="py-6 flex flex-col items-center text-center space-y-3">
                {!isFlipped ? (
                  <>
                    <div className="text-xs uppercase font-mono tracking-wider text-slate-500">
                      QUESTION / CONCEPT
                    </div>
                    <h3 className="text-lg font-bold text-slate-100 leading-snug">
                      {currentCard.front}
                    </h3>
                  </>
                ) : (
                  <>
                    <div className="text-xs uppercase font-mono tracking-wider text-emerald-400">
                      REASONING & ANSWER
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-sans">
                      {currentCard.back}
                    </p>
                    {currentCard.formula && (
                      <div className="p-2 bg-slate-900/90 border border-slate-700/80 rounded-xl font-mono text-xs text-cyan-300 shadow-inner">
                        {currentCard.formula}
                      </div>
                    )}
                    {currentCard.memory_hook && (
                      <div className="text-xs text-amber-300 font-sans italic">
                        💡 Memory Trick: {currentCard.memory_hook}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Status Hint */}
              <div className="text-center text-[11px] text-slate-500 font-mono">
                {isFlipped ? "Showing solution • Rate yourself below" : "Recall the principle in your mind first"}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 font-mono">No flashcards available.</div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= cards.length - 1}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNext()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
            >
              Still Learning
            </button>
            <button
              onClick={markMastered}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Know This (Mark Mastered)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardStudyModal;
