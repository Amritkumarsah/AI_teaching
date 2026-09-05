import re
from pathlib import Path
from typing import List, Dict, Any
from pypdf import PdfReader
from docx import Document as DocxDocument
from pptx import Presentation

class DocumentParser:
    """
    Extracts text, headings, sections, and tables from PDF, DOCX, PPTX, and TXT files.
    Applies semantic chunking preserving heading hierarchy and page numbers.
    """

    @staticmethod
    def parse_file(file_path: Path) -> List[Dict[str, Any]]:
        suffix = file_path.suffix.lower()
        if suffix == ".pdf":
            return DocumentParser._parse_pdf(file_path)
        elif suffix in [".docx", ".doc"]:
            return DocumentParser._parse_docx(file_path)
        elif suffix in [".pptx", ".ppt"]:
            return DocumentParser._parse_pptx(file_path)
        elif suffix in [".txt", ".md"]:
            return DocumentParser._parse_txt(file_path)
        else:
            raise ValueError(f"Unsupported file format: {suffix}")

    @staticmethod
    def _parse_pdf(file_path: Path) -> List[Dict[str, Any]]:
        reader = PdfReader(str(file_path))
        chunks = []
        chunk_idx = 0
        current_section = "General Overview"

        for page_num, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            if not text.strip():
                continue
            
            lines = [line.strip() for line in text.split("\n") if line.strip()]
            paragraph_buffer = []

            for line in lines:
                # Detect heading-like lines
                if re.match(r"^(Chapter\s+\d+|[0-9]+\.[0-9]+|[A-Z\s]{4,}|#+)", line) and len(line) < 80:
                    if paragraph_buffer:
                        p_text = " ".join(paragraph_buffer)
                        if len(p_text.split()) >= 15:
                            chunks.append({
                                "chunk_id": f"pdf-p{page_num}-c{chunk_idx}",
                                "page_number": page_num,
                                "section_title": current_section,
                                "text": p_text,
                                "char_count": len(p_text),
                                "source_file": file_path.name
                            })
                            chunk_idx += 1
                        paragraph_buffer = []
                    current_section = line.strip("#").strip()
                else:
                    paragraph_buffer.append(line)

            if paragraph_buffer:
                p_text = " ".join(paragraph_buffer)
                if len(p_text.split()) >= 10:
                    chunks.append({
                        "chunk_id": f"pdf-p{page_num}-c{chunk_idx}",
                        "page_number": page_num,
                        "section_title": current_section,
                        "text": p_text,
                        "char_count": len(p_text),
                        "source_file": file_path.name
                    })
                    chunk_idx += 1

        return chunks

    @staticmethod
    def _parse_docx(file_path: Path) -> List[Dict[str, Any]]:
        doc = DocxDocument(str(file_path))
        chunks = []
        chunk_idx = 0
        current_section = "Document Content"
        paragraph_buffer = []

        for p in doc.paragraphs:
            text = p.text.strip()
            if not text:
                continue

            if p.style and "Heading" in p.style.name:
                if paragraph_buffer:
                    p_text = " ".join(paragraph_buffer)
                    chunks.append({
                        "chunk_id": f"docx-c{chunk_idx}",
                        "page_number": 1,
                        "section_title": current_section,
                        "text": p_text,
                        "char_count": len(p_text),
                        "source_file": file_path.name
                    })
                    chunk_idx += 1
                    paragraph_buffer = []
                current_section = text
            else:
                paragraph_buffer.append(text)
                if len(" ".join(paragraph_buffer).split()) >= 100:
                    p_text = " ".join(paragraph_buffer)
                    chunks.append({
                        "chunk_id": f"docx-c{chunk_idx}",
                        "page_number": 1,
                        "section_title": current_section,
                        "text": p_text,
                        "char_count": len(p_text),
                        "source_file": file_path.name
                    })
                    chunk_idx += 1
                    paragraph_buffer = []

        if paragraph_buffer:
            p_text = " ".join(paragraph_buffer)
            chunks.append({
                "chunk_id": f"docx-c{chunk_idx}",
                "page_number": 1,
                "section_title": current_section,
                "text": p_text,
                "char_count": len(p_text),
                "source_file": file_path.name
            })

        return chunks

    @staticmethod
    def _parse_pptx(file_path: Path) -> List[Dict[str, Any]]:
        chunks = []
        chunk_idx = 0

        # Attempt modern PPTX parsing via python-pptx
        try:
            prs = Presentation(str(file_path))
            for slide_idx, slide in enumerate(prs.slides, start=1):
                slide_text = []
                title = f"Slide {slide_idx}"
                
                # Check slide title
                if slide.shapes.title and slide.shapes.title.has_text_frame:
                    t = slide.shapes.title.text_frame.text.strip()
                    if t:
                        title = t

                for shape in slide.shapes:
                    if shape.has_text_frame:
                        for paragraph in shape.text_frame.paragraphs:
                            text = paragraph.text.strip()
                            if text and text != title:
                                slide_text.append(text)
                    elif shape.has_table:
                        for row in shape.table.rows:
                            row_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                            if row_texts:
                                slide_text.append(" | ".join(row_texts))
                
                # Check speaker notes if present
                if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                    notes = slide.notes_slide.notes_text_frame.text.strip()
                    if notes:
                        slide_text.append(f"Notes: {notes}")

                if slide_text:
                    full_text = "\n".join(slide_text)
                    chunks.append({
                        "chunk_id": f"pptx-s{slide_idx}-c{chunk_idx}",
                        "page_number": slide_idx,
                        "section_title": title,
                        "text": f"{title}\n{full_text}",
                        "char_count": len(full_text),
                        "source_file": file_path.name
                    })
                    chunk_idx += 1
            if chunks:
                return chunks
        except Exception as e:
            # Fallback for binary .ppt or corrupted packages
            pass

        # Legacy binary .ppt or raw stream fallback
        try:
            with open(file_path, "rb") as f:
                raw_bytes = f.read()
            # Extract printable ASCII / UTF-8 sequences of length >= 6
            matches = re.findall(rb'[\x20-\x7E\x80-\xFF]{6,}', raw_bytes)
            valid_strings = []
            for m in matches:
                try:
                    s = m.decode("utf-8", errors="ignore").strip()
                    if len(s) > 8 and not s.startswith("xml") and not s.startswith("http"):
                        valid_strings.append(s)
                except Exception:
                    pass

            if valid_strings:
                step = max(len(valid_strings) // 4, 1)
                for i in range(0, min(len(valid_strings), 16), step):
                    batch = valid_strings[i:i + step]
                    sec_title = batch[0][:50] if batch else f"Slide Section {i // step + 1}"
                    text = "\n".join(batch)
                    chunks.append({
                        "chunk_id": f"ppt-raw-c{chunk_idx}",
                        "page_number": (i // step) + 1,
                        "section_title": sec_title,
                        "text": text,
                        "char_count": len(text),
                        "source_file": file_path.name
                    })
                    chunk_idx += 1
        except Exception:
            pass

        return chunks

    @staticmethod
    def _parse_txt(file_path: Path) -> List[Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        sections = re.split(r"(?m)^(?:#{1,3}|[0-9]+\.[0-9]+)\s+", content)
        headers = re.findall(r"(?m)^(?:#{1,3}|[0-9]+\.[0-9]+)\s+(.+)$", content)

        chunks = []
        chunk_idx = 0
        
        # If markdown headings found
        if headers and len(sections) > 1:
            for i, body in enumerate(sections[1:]):
                title = headers[i].strip() if i < len(headers) else f"Section {i+1}"
                paragraphs = [p.strip() for p in body.split("\n\n") if p.strip()]
                for p in paragraphs:
                    if len(p.split()) >= 8:
                        chunks.append({
                            "chunk_id": f"txt-c{chunk_idx}",
                            "page_number": 1,
                            "section_title": title,
                            "text": p,
                            "char_count": len(p),
                            "source_file": file_path.name
                        })
                        chunk_idx += 1
        else:
            paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
            for p in paragraphs:
                if len(p.split()) >= 10:
                    chunks.append({
                        "chunk_id": f"txt-c{chunk_idx}",
                        "page_number": 1,
                        "section_title": "General Content",
                        "text": p,
                        "char_count": len(p),
                        "source_file": file_path.name
                    })
                    chunk_idx += 1

        return chunks
