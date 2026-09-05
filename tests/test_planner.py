import pytest
from backend.services.learner_profiler import LearnerProfiler
from backend.services.lesson_planner import LessonPlanner

def test_learner_profiler_parsing():
    prompt = "I'm a beginner, teach me Chapter 4 in 20 minutes, in Hindi, with simple examples, and quiz me at the end"
    profile = LearnerProfiler.parse_instruction(prompt, default_topic="Chapter 4")
    
    assert profile["level"] == "beginner"
    assert profile["target_time_minutes"] == 20
    assert profile["language"] == "hi"
    assert profile["teaching_style"] == "intuitive"
    assert profile["quiz_requested"] is True
    assert profile["is_multiday"] is False

def test_time_budget_scaling():
    # 5-minute plan
    prof_5m = {"level": "beginner", "target_time_minutes": 5, "language": "en", "topic": "Newton's Laws"}
    plan_5m = LessonPlanner.plan_lesson(prof_5m)
    assert plan_5m["concepts_count"] <= 2
    assert plan_5m["target_time_minutes"] == 5

    # 20-minute plan
    prof_20m = {"level": "intermediate", "target_time_minutes": 20, "language": "en", "topic": "Newton's Laws"}
    plan_20m = LessonPlanner.plan_lesson(prof_20m)
    assert plan_20m["concepts_count"] >= 3
    assert plan_20m["target_time_minutes"] == 20

    # 60-minute plan
    prof_60m = {"level": "advanced", "target_time_minutes": 60, "language": "en", "topic": "Newton's Laws"}
    plan_60m = LessonPlanner.plan_lesson(prof_60m)
    assert plan_60m["concepts_count"] > plan_20m["concepts_count"]

    # 7-day multi-day plan
    prof_7d = {"level": "beginner", "target_time_minutes": 210, "is_multiday": True, "multiday_count": 7, "language": "en", "topic": "Newton's Laws"}
    plan_7d = LessonPlanner.plan_lesson(prof_7d)
    assert plan_7d["is_multiday"] is True
    assert len(plan_7d["curriculum"]) == 7
