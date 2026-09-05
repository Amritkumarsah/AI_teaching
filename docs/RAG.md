# Retrieval-Augmented Generation (RAG) Architecture

## 1. Grounded Teaching Pipeline

```text
Uploaded File (PDF, DOCX, PPTX, TXT)
                  │
                  ▼
         [Text Extraction]
                  │
                  ▼
     [Prompt Injection Defense]  ◄── Sanitizes untrusted text
                  │
                  ▼
      [Semantic Section Chunker] ◄── Adds page/chapter metadata
                  │
                  ▼
        [Vector Index Store]     ◄── TF-IDF / Cosine Similarity Index
                  │
                  ▼
        [Top-K Citation Search]  ◄── Extracts relevance snippets
                  │
                  ▼
        [AI Teacher Grounding]   ◄── Synthesizes lessons with citations
```

## 2. Prompt Injection Defense

Uploaded educational documents are untrusted external inputs. The platform applies sanitization rules:
- Redacts meta-prompt injection vectors (e.g. *"Ignore all previous instructions"*).
- Neutralizes fake system role tags (`System: ...` converted into `Data: ...`).
- Forces the LLM to treat document extracts strictly as **untrusted passive context**, never as executive prompts.

## 3. Citation Attribution

Every retrieved chunk includes full provenance metadata:
```json
{
  "documentName": "NCERT_Physics_Class11_Ch4.pdf",
  "chapter": "Chapter 4: Laws of Motion",
  "section": "Section 4.2: The Law of Inertia",
  "pageNumber": 42,
  "relevanceScore": 0.94,
  "snippet": "Every body continues in its state of rest..."
}
```
This enables the student to see exactly which page and paragraph the AI Teacher referenced.
