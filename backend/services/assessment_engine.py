import re
from typing import Dict, Any, List, Optional

class AssessmentEngine:
    """
    INTERACTION & ADAPTIVE ASSESSMENT ENGINE
    - Semantic answer evaluation (rubric matching, free text analysis)
    - Misconception classification & diagnosis
    - Adaptive branching with alternative mental models and analogies
    - Final assessment & comprehensive Learning Report generation
    """

    KNOWN_MISCONCEPTIONS = {
        "continuous_force": {
            "keywords": ["need push", "force runs out", "stop moving", "slows down without force", "ruk jayegi"],
            "diagnosis": "Aristotelian Fallacy: Believing that continuous motion requires a continuous force.",
            "re_explanation": (
                "Let's step back and look at this with a new mental model! "
                "Think of an air-hockey puck gliding on a cushion of air. "
                "When you tap it once, it zips across the table without you touching it again. "
                "In space, the puck would glide through galaxies forever! "
                "Force is only needed to CHANGE velocity (accelerate or stop), not to KEEP moving!"
            ),
            "follow_up_question": "If an asteroid has been traveling at 20,000 km/h in deep space for a million years, how much engine force is currently pushing it?"
        },
        "heavier_falls_faster": {
            "keywords": ["heavy falls first", "more gravity faster", "bowling ball hits first", "bhari jaldi", "heavier first"],
            "diagnosis": "Gravitational Mass vs Inertial Mass Conflation: Assuming greater gravitational pull implies greater acceleration.",
            "re_explanation": (
                "Here is an intuitive way to visualize this: "
                "Imagine you glue two identical 1 kg bricks side-by-side. "
                "Does each brick magically know it is glued and fall twice as fast? No! "
                "Each kilogram accelerates at 9.8 m/s². "
                "A 10 kg object feels 10 times more gravity, but it has 10 times more mass resisting acceleration. "
                "The two effects cancel: a = (10 * g) / 10 = g!"
            ),
            "follow_up_question": "On the Moon, astronaut David Scott dropped a 1.3 kg aluminum hammer and a 0.03 kg falcon feather simultaneously. Which hit the lunar dust first?"
        },
        "action_reaction_cancel": {
            "keywords": ["cancel out", "zero force", "cancel each other", "no motion", "shunya ho jayega"],
            "diagnosis": "Internal vs External Force Misunderstanding: Believing Newton's 3rd Law pairs act on the same object.",
            "re_explanation": (
                "Think about this crystal-clear rule: Forces can ONLY cancel if they are drawn on the EXACT same free-body diagram! "
                "When you swim, you push water backward (Force on water). "
                "The water pushes you forward (Force on you). "
                "Since the forward force acts on YOUR body, YOU accelerate forward! "
                "Action and Reaction never act on the same object, so they can NEVER cancel out!"
            ),
            "follow_up_question": "When a horse pulls a cart, the cart pulls back on the horse with an equal and opposite force. Why does the cart still move forward?"
        }
    }

    @staticmethod
    def evaluate_answer(question: Dict[str, Any], student_answer: Any) -> Dict[str, Any]:
        q_type = question.get("type", "mcq")

        if q_type == "mcq":
            return AssessmentEngine._evaluate_mcq(question, student_answer)
        else:
            return AssessmentEngine._evaluate_free_text(question, str(student_answer))

    @staticmethod
    def _evaluate_mcq(question: Dict[str, Any], selected_index: Any) -> Dict[str, Any]:
        correct_idx = question.get("correct_answer_index", 0)
        try:
            sel_idx = int(selected_index)
        except (ValueError, TypeError):
            sel_idx = -1

        is_correct = (sel_idx == correct_idx)
        traps = question.get("misconception_traps", {})

        if is_correct:
            return {
                "verdict": "CORRECT",
                "score": 100,
                "feedback": "Outstanding! Your understanding is conceptually sound.",
                "action": "advance",
                "misconception_detected": None,
                "re_explanation": None
            }

        # Detect if student selected a known trap option
        trap_info = traps.get(sel_idx) or traps.get(str(sel_idx))
        correct_ans = question.get("correct_answer") or (
            question.get("options", [])[correct_idx] if question.get("options") and len(question.get("options")) > correct_idx else "the verified answer"
        )
        re_expl = (
            f"Not quite. The correct concept is: {correct_ans}. "
            "Please review the core takeaway and let's try another check!"
        )

        misconception_key = None
        if trap_info:
            trap_str = str(trap_info).lower()
            if "continuous" in trap_str or "aristotle" in trap_str:
                misconception_key = "continuous_force"
            elif "gravity" in trap_str or "fall" in trap_str:
                misconception_key = "heavier_falls_faster"
            elif "cancel" in trap_str:
                misconception_key = "action_reaction_cancel"

        if misconception_key and misconception_key in AssessmentEngine.KNOWN_MISCONCEPTIONS:
            m_data = AssessmentEngine.KNOWN_MISCONCEPTIONS[misconception_key]
            return {
                "verdict": "MISCONCEPTION",
                "score": 30,
                "feedback": f"Misconception Detected: {m_data['diagnosis']}",
                "action": "re_explain_branch",
                "misconception_detected": m_data["diagnosis"],
                "re_explanation": m_data["re_explanation"],
                "follow_up_question": m_data["follow_up_question"]
            }

        return {
            "verdict": "PARTIALLY_CORRECT",
            "score": 40,
            "feedback": "Incorrect choice. Notice how net external force determines the behavior.",
            "action": "re_explain_branch",
            "misconception_detected": "General conceptual confusion.",
            "re_explanation": re_expl,
            "follow_up_question": "Let's rethink: If the net external force is zero, what happens to an object's velocity?"
        }

    @staticmethod
    def _evaluate_free_text(question: Dict[str, Any], answer_text: str) -> Dict[str, Any]:
        text_lower = answer_text.lower().strip()
        rubric = question.get("rubric", "")
        sample_answer = question.get("sample_answer", "").lower()

        # Check for empty / no understanding
        if len(text_lower.split()) < 3 or text_lower in ["idk", "i dont know", "no idea", "pata nahi", "skip"]:
            return {
                "verdict": "NO_UNDERSTANDING",
                "score": 0,
                "feedback": "No worries! This is a tricky concept that confuses many students.",
                "action": "simplify_and_reteach",
                "misconception_detected": None,
                "re_explanation": "Let's simplify this to the absolute basics: An object cannot change its speed or direction by itself. Only an outside push or pull can change it.",
                "follow_up_question": "What is the only thing that can change the motion of an object?"
            }

        # Check for known misconceptions in text
        for m_key, m_val in AssessmentEngine.KNOWN_MISCONCEPTIONS.items():
            if any(k in text_lower for k in m_val["keywords"]):
                return {
                    "verdict": "MISCONCEPTION",
                    "score": 25,
                    "feedback": f"Diagnosed Misconception: {m_val['diagnosis']}",
                    "action": "re_explain_branch",
                    "misconception_detected": m_val["diagnosis"],
                    "re_explanation": m_val["re_explanation"],
                    "follow_up_question": m_val["follow_up_question"]
                }

        # Rubric matching: check key terms from question rubric and sample answer
        key_tokens = [w for w in re.findall(r"\b\w{4,}\b", sample_answer + " " + rubric) if w not in ["that", "with", "this", "they", "from"]]
        matched_tokens = [t for t in key_tokens if t in text_lower]

        match_ratio = len(matched_tokens) / max(len(set(key_tokens)), 1)

        if match_ratio >= 0.4 or ("different" in text_lower and "object" in text_lower) or ("mass" in text_lower and "inertia" in text_lower):
            return {
                "verdict": "CORRECT",
                "score": 95,
                "feedback": "Brilliant explanation! You captured the fundamental physical principle accurately.",
                "action": "advance",
                "misconception_detected": None,
                "re_explanation": None
            }
        else:
            return {
                "verdict": "PARTIALLY_CORRECT",
                "score": 60,
                "feedback": "You are on the right track, but missing a crucial detail (like specifying that forces act on different bodies).",
                "action": "clarify_and_advance",
                "misconception_detected": "Incomplete conceptual formulation.",
                "re_explanation": "Keep in mind: In physics, the exact recipient of the force determines where acceleration happens.",
                "follow_up_question": None
            }

    @staticmethod
    def generate_final_report(session_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Synthesizes a structured post-session learning report card.
        """
        scores = session_data.get("scores", [85, 90, 75])
        avg_score = round(sum(scores) / max(len(scores), 1), 1)
        misconceptions = session_data.get("misconceptions_found", [])
        topic = session_data.get("topic", "Newton's Laws of Motion")
        learner_level = session_data.get("learner_level", "beginner")

        strengths = [
            "Strong grasp of Newton's First Law and the concept of mass as inertia.",
            "Understands the difference between velocity and acceleration.",
            "Correctly identified action-reaction pairs in real-world propulsion."
        ]
        
        weaknesses = []
        if misconceptions:
            for m in misconceptions:
                weaknesses.append(f"Initially conflated: {m}")
        else:
            weaknesses.append("Can practice multi-step vector arithmetic under friction.")

        recommendations = [
            "Review Free-Body Diagram exercises with tilted inclined planes.",
            "Explore real-world aerospace simulations (satellite orbital mechanics).",
            f"Next Recommended Module: 'Conservation of Momentum & Collisions' (Prerequisite: {topic})"
        ]

        return {
            "topic": topic,
            "overall_score": avg_score,
            "grade": "A" if avg_score >= 85 else ("B" if avg_score >= 70 else "C"),
            "learner_level": learner_level,
            "concepts_mastered": session_data.get("concepts_completed", ["Inertia", "F=ma", "Action-Reaction"]),
            "strengths": strengths,
            "weaknesses_identified": weaknesses,
            "misconceptions_resolved": misconceptions if misconceptions else ["None (Demonstrated high intuition)"],
            "recommended_next_topic": "Work, Energy, and Power in Dynamics",
            "study_recommendations": recommendations,
            "certificate_status": "Passed with Distinction" if avg_score >= 80 else "Completed"
        }

assessment_engine = AssessmentEngine()
