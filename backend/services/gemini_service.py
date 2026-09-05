import json
import logging
import httpx
from typing import Optional, List, Dict, Any
from ..config import settings

logger = logging.getLogger("ai_teacher.gemini")

class GeminiService:
    """
    100% Free Tier integration with Google Gemini 1.5 Flash.
    Google AI Studio provides 15 requests per minute, 1,500 requests per day,
    completely free with NO credit card required.
    
    If no key is configured, or if an API call fails/times out,
    the system automatically falls back to local zero-cost processing.
    """

    MODELS = [
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash"
    ]

    @classmethod
    def is_available(cls) -> bool:
        return bool(settings.gemini_api_key and len(settings.gemini_api_key.strip()) > 10)

    @classmethod
    def generate_content(cls, prompt: str, system_instruction: Optional[str] = None, timeout: float = 25.0, response_json: bool = False, models: Optional[List[str]] = None) -> Optional[str]:
        if not cls.is_available():
            return None

        key = settings.gemini_api_key.strip()
        headers = {"Content-Type": "application/json"}
        
        contents = []
        if system_instruction:
            contents.append({"role": "user", "parts": [{"text": f"SYSTEM INSTRUCTION: {system_instruction}"}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I will follow these instructions."}]})
            
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        gen_config = {
            "temperature": 0.2,
            "maxOutputTokens": 4096,
        }
        if response_json:
            gen_config["response_mime_type"] = "application/json"

        body = {
            "contents": contents,
            "generationConfig": gen_config
        }

        candidate_models = models or cls.MODELS
        for model in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            try:
                with httpx.Client(timeout=timeout) as client:
                    res = client.post(url, headers=headers, json=body)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "")
                    else:
                        logger.warning(f"Gemini model {model} returned status {res.status_code}: {res.text[:150]}")
            except Exception as e:
                logger.warning(f"Gemini API call on {model} failed: {e}")

        return None

    @classmethod
    def plan_lesson_from_text(cls, text: str, topic: str, level: str, count: int = 3) -> Optional[List[Dict[str, Any]]]:
        """
        Uses Gemini 1.5 Flash (Free Tier) to dynamically extract structured concepts from uploaded document text.
        Returns None if Gemini is not configured, allowing local free parser to handle it.
        """
        if not cls.is_available():
            return None

        prompt = f"""
You are an expert AI Educator. Given the following educational material about "{topic}", extract exactly {count} key instructional concepts suitable for a {level} learner.

Material:
{text[:4000]}

Return a strict JSON array of objects without Markdown formatting or backticks. Each object must have:
- "title": string (Clear concept title)
- "summary": string (2-3 sentence core explanation)
- "key_terms": list of 3-4 strings (technical or essential keywords)
- "question": string (A conceptual check question for the student)
- "sample_answer": string (A model answer)
- "options": list of 4 strings (for multiple choice question)
- "correct_option": integer (0 to 3)

Only output valid JSON.
"""
        raw = cls.generate_content(
            prompt,
            system_instruction="Output a valid JSON array of objects. Each object represents a concept with title, summary, key_terms, question, sample_answer, options, and correct_option.",
            response_json=True
        )
        if not raw:
            return None

        try:
            clean = raw.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.startswith("```"):
                clean = clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            clean = clean.strip()
            
            parsed = json.loads(clean)
            if isinstance(parsed, list) and len(parsed) > 0:
                formatted = []
                for idx, item in enumerate(parsed[:count], start=1):
                    summary = item.get("summary", "")
                    checkpoint_data = {
                        "type": "mcq",
                        "question": item.get("question", "What is the key takeaway?"),
                        "options": item.get("options", ["Option A", "Option B", "Option C", "Option D"]),
                        "correct_answer": item.get("sample_answer", "Correct"),
                        "correct_idx": item.get("correct_option", 0),
                        "bloom_level": "understand"
                    }
                    formatted.append({
                        "id": f"custom_gemini_c{idx}",
                        "title": item.get("title", f"Concept {idx}"),
                        "time_weight": "standard",
                        "estimated_seconds": 180,
                        "teaching_phase": "instruction",
                        "explanation": summary,
                        "explanation_focus": summary,
                        "raw_text": summary,
                        "visual_type": "CONCEPT_CARD",
                        "key_terms": item.get("key_terms", []),
                        "pedagogical_purpose": "foundation",
                        "checkpoint": checkpoint_data,
                        "checkpoint_question": checkpoint_data
                    })
                return formatted
        except Exception as e:
            logger.warning(f"Failed to parse Gemini lesson response as JSON: {e}")

        return None

    @classmethod
    def generate_quiz(cls, text: str, topic: str, count: int = 10, language: str = "en") -> Optional[List[Dict[str, Any]]]:
        """
        Uses Gemini to generate a structured 10-question quiz grounded in the document material.
        """
        if not cls.is_available():
            return None

        lang_instruction = "Hinglish (mix of Hindi and English)" if language == "hinglish" else ("Hindi (हिंदी)" if language == "hi" else "English")

        prompt = f"""
Create a quick, engaging {count}-question multiple choice quiz for students about "{topic}".
Context:
{text[:2000] if text else 'Key principles of ' + topic}

Language: {lang_instruction}
Keep questions, options, and explanations concise (under 25 words each) for lightning-fast learning.

Return a valid JSON array of {count} question objects with keys:
- "id": number (1 to {count})
- "question": string
- "options": list of 4 choices
- "correct_idx": integer 0-3
- "explanation": 1 concise sentence explaining the answer
- "difficulty": "easy" | "medium" | "hard"
"""
        raw = cls.generate_content(
            prompt,
            system_instruction="Output a valid JSON array of concise question objects.",
            timeout=5.0,
            response_json=True,
            models=["gemini-3.5-flash"]
        )
        if not raw:
            return None

        try:
            clean = raw.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.startswith("```"):
                clean = clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            parsed = json.loads(clean.strip())
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed[:count]
        except Exception as e:
            logger.warning(f"Failed to parse Gemini quiz response: {e}")

        return None

    @classmethod
    def generate_flashcards(cls, text: str, topic: str, count: int = 6, language: str = "en") -> Optional[List[Dict[str, Any]]]:
        """
        Uses Gemini to generate structured high-yield active recall flashcards grounded in document text.
        """
        if not cls.is_available():
            return None

        lang_instruction = "Hinglish (mix of Hindi and English)" if language == "hinglish" else ("Hindi (हिंदी)" if language == "hi" else "English")

        prompt = f"""
Create {count} high-yield, active-recall study flashcards for students about "{topic}".
Source Material Context:
{text[:2500] if text else 'Core concepts of ' + topic}

Language: {lang_instruction}

Return a valid JSON array of {count} flashcard objects with keys:
- "id": integer 1 to {count}
- "category": string (e.g., "Core Principle", "Key Equation / Definition", "High-Frequency Exam Trap", "Mechanism / Architecture", "Boundary Condition")
- "front": string (concise question or trigger prompt)
- "back": string (clear, accurate, punchy explanation)
- "formula": string (mathematical formula, code snippet, or core rule)
- "memory_hook": string (catchy mnemonic or real-world mental model)
"""
        raw = cls.generate_content(
            prompt,
            system_instruction="Output a valid JSON array of flashcard objects.",
            timeout=3.0,
            response_json=True,
            models=["gemini-3.5-flash"]
        )
        if not raw:
            return None

        try:
            clean = raw.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.startswith("```"):
                clean = clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            parsed = json.loads(clean.strip())
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed[:count]
        except Exception as e:
            logger.warning(f"Failed to parse Gemini flashcards response: {e}")

        return None

    @classmethod
    def generate_cheat_sheet(cls, text: str, topic: str, language: str = "en") -> Optional[Dict[str, Any]]:
        """
        Uses Gemini to generate an exam-cram summary sheet grounded in document text.
        """
        if not cls.is_available():
            return None

        lang_instruction = "Hinglish (mix of Hindi and English)" if language == "hinglish" else ("Hindi (हिंदी)" if language == "hi" else "English")

        prompt = f"""
Create an authoritative, 1-page High-Yield Exam Cram Cheat Sheet for students about "{topic}".
Source Material Context:
{text[:3000] if text else 'Core concepts of ' + topic}

Language: {lang_instruction}

Return a valid JSON object with the following structure:
{{
  "topic": "{topic}",
  "exam_badge": "High Yield • Core Revision Sheet",
  "key_formulas": [
    {{
      "name": "Formula or Definition Name",
      "equation": "Mathematical equation, code syntax, or fundamental law",
      "si_units": "Units, parameter types, or boundary constraints",
      "note": "Critical exam takeaway"
    }}
  ],
  "common_exam_traps": [
    {{
      "trap": "Common student mistake or fallacy",
      "why_it_happens": "Why students get confused",
      "pro_tip": "How to avoid losing marks"
    }}
  ],
  "solved_practice_problems": [
    {{
      "problem": "Typical exam numerical or conceptual question",
      "solution_steps": ["Step 1...", "Step 2...", "Step 3..."],
      "answer": "Final concise answer"
    }}
  ],
  "rapid_revision_mnemonics": [
    "Memory acronym or hook 1",
    "Memory acronym or hook 2"
  ]
}}
"""
        raw = cls.generate_content(
            prompt,
            system_instruction="Output a valid JSON object matching the requested cheat sheet schema.",
            timeout=3.0,
            response_json=True,
            models=["gemini-3.5-flash"]
        )
        if not raw:
            return None

        try:
            clean = raw.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.startswith("```"):
                clean = clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            parsed = json.loads(clean.strip())
            if isinstance(parsed, dict) and "key_formulas" in parsed:
                return parsed
        except Exception as e:
            logger.warning(f"Failed to parse Gemini cheat sheet response: {e}")

        return None

gemini_service = GeminiService()
