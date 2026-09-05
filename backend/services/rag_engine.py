import math
import re
from collections import Counter
from typing import List, Dict, Any, Optional

class RAGEngine:
    """
    Knowledge Grounding & RAG Vector Engine.
    Stores semantic chunks, executes similarity search, preserves full provenance,
    and handles fallback to General Knowledge mode.
    """

    def __init__(self):
        self.documents: Dict[str, List[Dict[str, Any]]] = {}
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}

    def _tokenize(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r"\b[a-zA-Z0-9_]{2,}\b", text)]

    def index_document(self, doc_id: str, chunks: List[Dict[str, Any]]):
        self.documents[doc_id] = chunks
        self._recompute_idf()

    def _recompute_idf(self):
        total_chunks = sum(len(chunks) for chunks in self.documents.values())
        if total_chunks == 0:
            return

        doc_freq = Counter()
        for chunks in self.documents.values():
            for c in chunks:
                tokens = set(self._tokenize(c["text"] + " " + c.get("section_title", "")))
                for t in tokens:
                    doc_freq[t] += 1

        self.idf = {
            token: math.log((total_chunks + 1) / (df + 1)) + 1.0
            for token, df in doc_freq.items()
        }

    def _vectorize(self, tokens: List[str]) -> Dict[str, float]:
        counts = Counter(tokens)
        vec = {}
        norm_sq = 0.0
        for token, count in counts.items():
            weight = (1 + math.log(count)) * self.idf.get(token, 1.0)
            vec[token] = weight
            norm_sq += weight * weight
        
        norm = math.sqrt(norm_sq) or 1.0
        return {k: v / norm for k, v in vec.items()}

    def _cosine_similarity(self, vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
        score = 0.0
        for k, v in vec_a.items():
            if k in vec_b:
                score += v * vec_b[k]
        return score

    def retrieve(self, query: str, doc_id: Optional[str] = None, top_k: int = 3) -> Dict[str, Any]:
        """
        Retrieves top-k relevant chunks.
        If no document exists or doc_id not found, returns General Knowledge mode.
        """
        all_chunks = []
        if doc_id and doc_id in self.documents:
            all_chunks = self.documents[doc_id]
        elif self.documents:
            for d_chunks in self.documents.values():
                all_chunks.extend(d_chunks)

        if not all_chunks:
            return {
                "is_grounded": False,
                "confidence_framing": "general_knowledge",
                "message": "No document uploaded or found. Operating in General Knowledge Mode with lower confidence framing.",
                "retrieved_chunks": []
            }

        q_tokens = self._tokenize(query)
        if not q_tokens:
            return {
                "is_grounded": True,
                "confidence_framing": "high_grounded",
                "retrieved_chunks": all_chunks[:top_k]
            }

        q_vec = self._vectorize(q_tokens)
        scored = []

        for chunk in all_chunks:
            c_text = chunk["text"] + " " + chunk.get("section_title", "")
            c_tokens = self._tokenize(c_text)
            c_vec = self._vectorize(c_tokens)
            sim = self._cosine_similarity(q_vec, c_vec)

            # Keyword boost if exact phrases match
            for t in q_tokens:
                if t in c_text.lower():
                    sim += 0.08

            scored.append((sim, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)

        top_results = []
        for score, chunk in scored[:top_k]:
            top_results.append({
                "chunk_id": chunk["chunk_id"],
                "source_file": chunk.get("source_file", "unknown"),
                "page_number": chunk.get("page_number", 1),
                "section_title": chunk.get("section_title", ""),
                "text": chunk["text"],
                "relevance_score": round(float(score), 4)
            })

        return {
            "is_grounded": True,
            "confidence_framing": "high_grounded",
            "doc_id": doc_id,
            "retrieved_chunks": top_results
        }

rag_engine = RAGEngine()
