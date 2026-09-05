import pytest
from backend.services.assessment_engine import AssessmentEngine

def test_mcq_correct_evaluation():
    q = {
        "type": "mcq",
        "question": "If an astronaut throws a wrench in deep space, what happens?",
        "correct_answer_index": 1,
        "misconception_traps": {
            0: "Aristotelian misconception: Believing motion requires an ongoing push."
        }
    }
    result = AssessmentEngine.evaluate_answer(q, 1)
    assert result["verdict"] == "CORRECT"
    assert result["score"] == 100
    assert result["action"] == "advance"

def test_misconception_detection_and_branching():
    q = {
        "type": "mcq",
        "question": "If an astronaut throws a wrench in deep space, what happens?",
        "correct_answer_index": 1,
        "misconception_traps": {
            0: "Aristotelian misconception: Believing motion requires continuous push."
        }
    }
    # Student selects option 0 (trap)
    result = AssessmentEngine.evaluate_answer(q, 0)
    assert result["verdict"] == "MISCONCEPTION"
    assert result["action"] == "re_explain_branch"
    assert "re_explanation" in result
    assert "follow_up_question" in result
    assert "Aristotelian" in result["misconception_detected"]

def test_free_text_misconception():
    q = {
        "type": "explain_own_words",
        "question": "Why don't action and reaction cancel out?",
        "sample_answer": "They act on different bodies.",
        "rubric": "Must mention forces act on different bodies."
    }
    # Student gives wrong misconception answer
    result = AssessmentEngine.evaluate_answer(q, "They cancel out because they are equal and opposite, so net force is zero force")
    assert result["verdict"] == "MISCONCEPTION"
    assert result["action"] == "re_explain_branch"
    assert "Internal vs External" in result["misconception_detected"]

def test_final_report_generation():
    session_data = {
        "topic": "Newton's Laws of Motion",
        "learner_level": "beginner",
        "duration_minutes": 20,
        "scores": [100, 85, 90],
        "misconceptions_found": ["Aristotelian continuous push assumption"]
    }
    report = AssessmentEngine.generate_final_report(session_data)
    assert report["overall_score"] > 80
    assert len(report["strengths"]) > 0
    assert len(report["study_recommendations"]) > 0
    assert "recommended_next_topic" in report
