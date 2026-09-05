import json
from pathlib import Path
from backend.services.lesson_planner import LessonPlanner

# Generate and save 5-min, 20-min, and 60-min lesson plans on Newton's Laws
prof_5m = {
    "topic": "Newton's Laws of Motion",
    "level": "beginner",
    "target_time_minutes": 5,
    "language": "hi",
    "teaching_style": "intuitive"
}
plan_5m = LessonPlanner.plan_lesson(prof_5m, doc_id="newtons_laws")

prof_20m = {
    "topic": "Newton's Laws of Motion",
    "level": "beginner",
    "target_time_minutes": 20,
    "language": "hi",
    "teaching_style": "intuitive"
}
plan_20m = LessonPlanner.plan_lesson(prof_20m, doc_id="newtons_laws")

prof_60m = {
    "topic": "Newton's Laws of Motion",
    "level": "intermediate",
    "target_time_minutes": 60,
    "language": "hi",
    "teaching_style": "rigorous"
}
plan_60m = LessonPlanner.plan_lesson(prof_60m, doc_id="newtons_laws")

out_dir = Path("backend/data")
out_dir.mkdir(parents=True, exist_ok=True)

with open(out_dir / "comparison_5min.json", "w", encoding="utf-8") as f:
    json.dump(plan_5m, f, indent=2, ensure_ascii=False)

with open(out_dir / "comparison_20min.json", "w", encoding="utf-8") as f:
    json.dump(plan_20m, f, indent=2, ensure_ascii=False)

with open(out_dir / "comparison_60min.json", "w", encoding="utf-8") as f:
    json.dump(plan_60m, f, indent=2, ensure_ascii=False)

print(f"Comparison plans generated:")
print(f"5-min concepts: {plan_5m['concepts_count']}, Estimated mins: {plan_5m['actual_planned_minutes']}")
print(f"20-min concepts: {plan_20m['concepts_count']}, Estimated mins: {plan_20m['actual_planned_minutes']}")
print(f"60-min concepts: {plan_60m['concepts_count']}, Estimated mins: {plan_60m['actual_planned_minutes']}")
