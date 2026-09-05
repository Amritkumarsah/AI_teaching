import re
from typing import Dict, Any

class LearnerProfiler:
    """
    Parses free-text learner instructions into a structured Learner Profile.
    """

    @staticmethod
    def parse_instruction(instruction: str, default_topic: str = "General Topic") -> Dict[str, Any]:
        text = instruction.lower()

        # 1. Level Detection
        level = "beginner"
        if any(w in text for w in ["advanced", "expert", "deep dive", "undergrad", "college", "rigorous"]):
            level = "advanced"
        elif any(w in text for w in ["intermediate", "high school", "class 11", "class 12", "moderate"]):
            level = "intermediate"
        elif any(w in text for w in ["class 8", "class 9", "class 10", "middle school", "grade 8"]):
            level = "intermediate-school"
        elif any(w in text for w in ["beginner", "starter", "zero knowledge", "simple", "kid", "child", "layman"]):
            level = "beginner"

        # 2. Time Budget Detection
        time_budget = 20
        is_multiday = False
        multiday_count = 0

        # Check for multi-day like "7 days", "3 weeks"
        days_match = re.search(r"(\d+)\s*(?:day|days|din)", text)
        if days_match:
            is_multiday = True
            multiday_count = int(days_match.group(1))
            time_budget = multiday_count * 30 # 30 min / day
        else:
            time_match = re.search(r"(\d+)\s*(?:min|minute|minutes|m\b)", text)
            if time_match:
                time_budget = int(time_match.group(1))
            elif "quick" in text or "crash" in text or "fast" in text:
                time_budget = 5
            elif "deep" in text or "comprehensive" in text or "full" in text or "hour" in text:
                time_budget = 60

        # Clamp single-session time budgets into representative buckets if needed
        if not is_multiday:
            if time_budget <= 8:
                time_budget = 5
            elif time_budget <= 35:
                time_budget = 20
            else:
                time_budget = 60

        # 3. Language Detection
        language = "en"
        language_display = "English"
        if any(w in text for w in ["hinglish", "hindi-english", "mix hindi"]):
            language = "hinglish"
            language_display = "Hinglish (Hindi + English)"
        elif any(w in text for w in ["hindi", "हिंदी", "shuddh hindi"]):
            language = "hi"
            language_display = "Hindi (हिंदी)"
        elif any(w in text for w in ["spanish", "español"]):
            language = "es"
            language_display = "Spanish (Español)"
        elif any(w in text for w in ["tamil", "தமிழ்"]):
            language = "ta"
            language_display = "Tamil (தமிழ்)"
        elif any(w in text for w in ["telugu", "తెలుగు"]):
            language = "te"
            language_display = "Telugu (తెలుగు)"
        elif any(w in text for w in ["bengali", "বাংলা"]):
            language = "bn"
            language_display = "Bengali (বাংলা)"

        # 4. Teaching Style
        style = "intuitive"
        if any(w in text for w in ["math", "formula", "rigorous", "formal", "equation", "proof"]):
            style = "rigorous"
        elif any(w in text for w in ["code", "practical", "implementation", "hands-on"]):
            style = "practical"
        elif any(w in text for w in ["example", "analogy", "story", "simple", "real-life", "visual"]):
            style = "intuitive"

        # 5. Goal
        goal = "conceptual_understanding"
        if any(w in text for w in ["exam", "test", "quiz", "marks", "grade", "cbse", "neet", "jee"]):
            goal = "exam_preparation"
        elif any(w in text for w in ["revision", "recap", "brush up"]):
            goal = "quick_revision"
        elif any(w in text for w in ["master", "build", "deep"]):
            goal = "deep_mastery"

        # 6. Quiz Requested
        quiz_requested = any(w in text for w in ["quiz", "test", "question", "evaluate", "assessment", "check"])

        # 7. Topic Extraction
        topic = default_topic
        topic_match = re.search(r"(?:teach me|explain|lesson on|about)\s+([a-zA-Z0-9\s\'\-]{3,40})(?:in|for|with|\.|\,|$)", text)
        if topic_match and len(topic_match.group(1).strip()) > 3:
            candidate = topic_match.group(1).strip()
            # filter out non-topic filler
            if not any(candidate.startswith(w) for w in ["in ", "a ", "the ", "with "]):
                topic = candidate.title()

        return {
            "level": level,
            "target_time_minutes": time_budget,
            "is_multiday": is_multiday,
            "multiday_count": multiday_count,
            "language": language,
            "language_display": language_display,
            "teaching_style": style,
            "learning_goal": goal,
            "quiz_requested": quiz_requested,
            "topic": topic,
            "raw_instruction": instruction
        }
