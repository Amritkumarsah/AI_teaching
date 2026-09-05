import pytest
from pathlib import Path
from backend.services.document_parser import DocumentParser
from backend.services.rag_engine import RAGEngine

def test_document_parsing_and_chunking():
    sample_file = Path("backend/sample_materials/newtons_laws.txt")
    assert sample_file.exists(), "Sample material file should exist"
    
    chunks = DocumentParser.parse_file(sample_file)
    assert len(chunks) > 0, "Should extract at least one semantic chunk"
    
    first_chunk = chunks[0]
    assert "chunk_id" in first_chunk
    assert "text" in first_chunk
    assert "section_title" in first_chunk
    assert first_chunk["source_file"] == "newtons_laws.txt"

def test_rag_retrieval_and_provenance():
    rag = RAGEngine()
    sample_file = Path("backend/sample_materials/newtons_laws.txt")
    chunks = DocumentParser.parse_file(sample_file)
    rag.index_document("newtons_laws", chunks)

    # Query for inertia
    res = rag.retrieve(query="What is inertia and Galileo's inclined planes?", doc_id="newtons_laws", top_k=2)
    assert res["is_grounded"] is True
    assert res["confidence_framing"] == "high_grounded"
    assert len(res["retrieved_chunks"]) <= 2
    
    top_chunk = res["retrieved_chunks"][0]
    assert "relevance_score" in top_chunk
    assert "source_file" in top_chunk
    assert top_chunk["relevance_score"] > 0

def test_rag_general_knowledge_fallback():
    rag = RAGEngine()
    # Query with no documents indexed
    res = rag.retrieve(query="Explain Quantum Entanglement")
    assert res["is_grounded"] is False
    assert res["confidence_framing"] == "general_knowledge"
    assert len(res["retrieved_chunks"]) == 0
