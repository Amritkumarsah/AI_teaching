import sqlite3
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from backend.config import settings

DB_PATH = settings.data_dir / "learner_profiles.db"

class LearnerProfileStore:
    """
    SQLite persistent storage for cross-session student learning profiles,
    mastery records, historical misconceptions, and curriculum progress.
    """

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self):
        return sqlite3.connect(str(self.db_path))

    def _init_db(self):
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS learners (
                    learner_id TEXT PRIMARY KEY,
                    name TEXT,
                    preferred_language TEXT,
                    default_level TEXT,
                    total_sessions_completed INTEGER DEFAULT 0,
                    avg_score REAL DEFAULT 0.0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS session_history (
                    session_id TEXT PRIMARY KEY,
                    learner_id TEXT,
                    topic TEXT,
                    duration_minutes INTEGER,
                    score REAL,
                    language TEXT,
                    concepts_mastered TEXT,
                    misconceptions TEXT,
                    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (learner_id) REFERENCES learners(learner_id)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS concept_mastery (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    learner_id TEXT,
                    concept_name TEXT,
                    mastery_score REAL,
                    last_reviewed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(learner_id, concept_name)
                )
            """)
            conn.commit()

        # Seed demo learner if empty
        self._seed_default_learner()

    def _seed_default_learner(self):
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM learners WHERE learner_id = 'default_student'")
            if cursor.fetchone()[0] == 0:
                cursor.execute("""
                    INSERT INTO learners (learner_id, name, preferred_language, default_level, total_sessions_completed, avg_score)
                    VALUES ('default_student', 'Alex Sharma', 'en', 'intermediate', 2, 85.0)
                """)
                cursor.execute("""
                    INSERT INTO session_history (session_id, learner_id, topic, duration_minutes, score, language, concepts_mastered, misconceptions)
                    VALUES (
                        'sess-101', 'default_student', 'Kinematics & Speed', 20, 88.0, 'en',
                        '["Velocity vs Speed", "Acceleration", "Displacement vectors"]',
                        '["Confused instantaneous velocity with average speed"]'
                    )
                """)
                cursor.execute("""
                    INSERT OR REPLACE INTO concept_mastery (learner_id, concept_name, mastery_score)
                    VALUES ('default_student', 'Displacement Vectors', 90.0)
                """)
                cursor.execute("""
                    INSERT OR REPLACE INTO concept_mastery (learner_id, concept_name, mastery_score)
                    VALUES ('default_student', 'Average Velocity', 65.0)
                """)
                conn.commit()

    def get_profile(self, learner_id: str = "default_student") -> Dict[str, Any]:
        with self._get_conn() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM learners WHERE learner_id = ?", (learner_id,))
            row = cursor.fetchone()
            if not row:
                return {}

            profile = dict(row)

            # Get recent sessions
            cursor.execute(
                "SELECT * FROM session_history WHERE learner_id = ? ORDER BY completed_at DESC LIMIT 5",
                (learner_id,)
            )
            sessions = [dict(r) for r in cursor.fetchall()]
            for s in sessions:
                try:
                    s["concepts_mastered"] = json.loads(s["concepts_mastered"])
                    s["misconceptions"] = json.loads(s["misconceptions"])
                except Exception:
                    pass

            # Get concept mastery
            cursor.execute("SELECT concept_name, mastery_score FROM concept_mastery WHERE learner_id = ?", (learner_id,))
            mastery = {r["concept_name"]: r["mastery_score"] for r in cursor.fetchall()}

            profile["recent_sessions"] = sessions
            profile["concept_mastery"] = mastery

            # Generate personalized greeting / recall prompt
            profile["personalized_recall_prompt"] = self._generate_recall_prompt(sessions, mastery)
            return profile

    def _generate_recall_prompt(self, sessions: List[Dict[str, Any]], mastery: Dict[str, float]) -> str:
        if not sessions:
            return "Welcome to your first lesson! What topic would you like to explore today?"
        
        last = sessions[0]
        weak_concepts = [c for c, s in mastery.items() if s < 75.0]
        
        if weak_concepts:
            return f"Welcome back! Last time in '{last['topic']}', you did great, but had a slight doubt on '{weak_concepts[0]}'. Would you like a 2-minute warmup refresher before our new lesson?"
        return f"Welcome back! You recently completed '{last['topic']}' with an awesome score of {last['score']}%. Ready to take the next step in your curriculum?"

    def record_session(self, learner_id: str, session_data: Dict[str, Any]):
        with self._get_conn() as conn:
            cursor = conn.cursor()
            sess_id = session_data.get("session_id", f"sess-{sqlite3.time.time()}")
            topic = session_data.get("topic", "General Topic")
            duration = session_data.get("duration_minutes", 20)
            score = session_data.get("score", 85.0)
            lang = session_data.get("language", "en")
            mastered = json.dumps(session_data.get("concepts_mastered", []))
            misconceptions = json.dumps(session_data.get("misconceptions", []))

            cursor.execute("""
                INSERT OR REPLACE INTO session_history (session_id, learner_id, topic, duration_minutes, score, language, concepts_mastered, misconceptions)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (sess_id, learner_id, topic, duration, score, lang, mastered, misconceptions))

            # Update learner stats
            cursor.execute("""
                UPDATE learners 
                SET total_sessions_completed = total_sessions_completed + 1,
                    avg_score = (avg_score + ?) / 2.0
                WHERE learner_id = ?
            """, (score, learner_id))

            # Update concept mastery
            for c in session_data.get("concepts_mastered", []):
                cursor.execute("""
                    INSERT OR REPLACE INTO concept_mastery (learner_id, concept_name, mastery_score)
                    VALUES (?, ?, ?)
                """, (learner_id, str(c), score))

            conn.commit()

learner_store = LearnerProfileStore()
