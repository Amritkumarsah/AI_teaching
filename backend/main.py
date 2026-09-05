import os
import sys
import shutil
import uuid
import re
import logging
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List

logger = logging.getLogger("ai_teacher.main")

# Ensure project root directory is in sys.path so 'backend.*' imports resolve properly
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.config import settings
from backend.services.document_parser import DocumentParser
from backend.services.rag_engine import rag_engine
from backend.services.learner_profiler import LearnerProfiler
from backend.services.lesson_planner import LessonPlanner
from backend.services.script_visual_generator import ScriptVisualGenerator
from backend.services.media_pipeline import media_pipeline
from backend.services.assessment_engine import assessment_engine
from backend.services.learner_profile_store import learner_store
from backend.services.learning_path_generator import learning_path_generator
from backend.services.gemini_service import gemini_service
from backend.services.live_class_service import live_class_manager

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="End-to-end adaptive AI Teacher prototype with RAG, Neural Voice, Synced Visuals, and Assessment."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for audio/video assets
app.mount("/static", StaticFiles(directory=str(settings.static_dir)), name="static")

# Auto-index sample materials on startup
@app.on_event("startup")
def startup_event():
    newtons_file = settings.sample_materials_dir / "newtons_laws.txt"
    if newtons_file.exists():
        chunks = DocumentParser.parse_file(newtons_file)
        rag_engine.index_document("newtons_laws", chunks)

    os_file = settings.sample_materials_dir / "operating_systems.txt"
    if os_file.exists():
        os_chunks = DocumentParser.parse_file(os_file)
        rag_engine.index_document("operating_systems", os_chunks)

class InstructionRequest(BaseModel):
    instruction: str
    default_topic: Optional[str] = "Newton's Laws"

class PlanLessonRequest(BaseModel):
    profile: Dict[str, Any]
    doc_id: Optional[str] = None

class NodeContentRequest(BaseModel):
    concept: Dict[str, Any]
    language: Optional[str] = "en"
    level: Optional[str] = "beginner"

class SpeechRequest(BaseModel):
    text: str
    language: Optional[str] = "en"
    personality: Optional[str] = "dr_arya"

class RenderVideoRequest(BaseModel):
    concept_title: str
    audio_path: str
    duration_seconds: float
    output_filename: str

class AnswerRequest(BaseModel):
    question: Dict[str, Any]
    student_answer: Any

class FinalReportRequest(BaseModel):
    session_data: Dict[str, Any]
    learner_id: Optional[str] = "default_student"

class FollowUpRequest(BaseModel):
    question: str
    concept_title: str
    doc_id: Optional[str] = None
    language: Optional[str] = "en"
    level: Optional[str] = "beginner"

class VideoPromptRequest(BaseModel):
    concept_title: str
    visual_type: Optional[str] = "SIMULATION_DIAGRAM"
    subject: Optional[str] = "Physics"

class QuizRequest(BaseModel):
    topic: str
    doc_id: Optional[str] = None
    language: Optional[str] = "en"
    count: Optional[int] = 10

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "indexed_documents": list(rag_engine.documents.keys())
    }

@app.get("/api/sample-materials")
def list_sample_materials():
    materials = [
        {
            "id": "newtons_laws",
            "title": "Newton's Laws of Motion & Inertia",
            "subject": "Physics",
            "file": "newtons_laws.txt",
            "description": "Comprehensive textbook chapter covering Galileo's inclined planes, F=ma, Action-Reaction, and common misconceptions."
        },
        {
            "id": "photosynthesis",
            "title": "Photosynthesis & The Calvin Cycle",
            "subject": "Biology",
            "file": "photosynthesis.txt",
            "description": "Plant biochemistry detailing thylakoid light reactions, photolysis of water, and dark reactions."
        },
        {
            "id": "bubble_sort",
            "title": "Sorting Algorithms — Bubble Sort",
            "subject": "Computer Science",
            "file": "bubble_sort.txt",
            "description": "Step-by-step adjacent comparison sorting, optimization with swapped flag, and O(n^2) complexity analysis."
        },
        {
            "id": "operating_systems",
            "title": "Operating Systems — Process Management",
            "subject": "Computer Science",
            "file": "operating_systems.txt",
            "description": "Process vs Program, Process States Lifecycle, PCB (Process Control Block), and Context Switching."
        }
    ]
    return {"sample_materials": materials}

@app.post("/api/load-sample")
def load_sample(sample_id: str = Form(...)):
    filename = f"{sample_id}.txt"
    file_path = settings.sample_materials_dir / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Sample material file not found")

    chunks = DocumentParser.parse_file(file_path)
    rag_engine.index_document(sample_id, chunks)

    return {
        "success": True,
        "doc_id": sample_id,
        "filename": filename,
        "total_chunks_indexed": len(chunks),
        "preview_chunks": chunks[:3]
    }

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in [".pdf", ".docx", ".doc", ".pptx", ".ppt", ".txt", ".md"]:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {suffix}. Supported: PDF, DOCX, PPTX, TXT.")

    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    saved_path = settings.uploads_dir / f"{doc_id}_{file.filename}"

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    chunks = DocumentParser.parse_file(saved_path)
    if not chunks:
        raise HTTPException(status_code=400, detail="Could not extract readable text from document.")

    rag_engine.index_document(doc_id, chunks)

    # Detect prominent title from chunks or clean filename
    raw_name = Path(file.filename).stem.replace("_", " ").replace("-", " ").title()
    detected_title = raw_name
    for c in chunks:
        sec = c.get("section_title", "").strip()
        if sec and sec not in ["General Overview", "General Content", "General", "Introduction", "Overview"]:
            detected_title = sec
            break

    return {
        "success": True,
        "doc_id": doc_id,
        "filename": file.filename,
        "detected_title": detected_title,
        "total_chunks": len(chunks),
        "preview": chunks[:2]
    }

@app.post("/api/parse-instruction")
def parse_instruction(req: InstructionRequest):
    profile = LearnerProfiler.parse_instruction(req.instruction, default_topic=req.default_topic)
    return {"profile": profile}

@app.post("/api/plan-lesson")
def plan_lesson(req: PlanLessonRequest):
    plan = LessonPlanner.plan_lesson(profile=req.profile, doc_id=req.doc_id)
    return {"plan": plan}

@app.post("/api/get-node-content")
def get_node_content(req: NodeContentRequest):
    content = ScriptVisualGenerator.generate_node_content(
        concept=req.concept,
        language=req.language,
        level=req.level
    )
    return {"content": content}

@app.post("/api/synthesize-speech")
async def synthesize_speech(req: SpeechRequest):
    result = await media_pipeline.synthesize_speech(
        text=req.text,
        language=req.language,
        personality=req.personality or "dr_arya"
    )
    return result

@app.get("/api/flashcards")
def get_flashcards(topic: Optional[str] = "physics", level: Optional[str] = "basic"):
    """
    High-Yield Interactive Flashcards for rapid spaced-repetition revision.
    """
    topic_clean = (topic or "").lower()
    
    if any(k in topic_clean for k in ["newton", "force", "motion", "inertia", "gravity", "physic"]):
        cards = [
            {
                "id": 1,
                "category": "Core Principle",
                "front": "Newton's First Law (Law of Inertia)",
                "back": "An object at rest stays at rest, and an object in motion stays in motion at constant velocity, UNLESS acted on by an unbalanced net external force.",
                "formula": r"\Sigma \vec{F} = 0 \implies \vec{a} = 0",
                "memory_hook": "Things keep doing what they are already doing. Mass is the measure of inertia."
            },
            {
                "id": 2,
                "category": "Equation & Units",
                "front": "Newton's Second Law Formula & SI Units",
                "back": "Force equals mass times acceleration. 1 Newton is the force required to accelerate 1 kg at 1 m/s².",
                "formula": r"\vec{F}_{\text{net}} = m \cdot \vec{a} = \frac{d\vec{p}}{dt}",
                "memory_hook": "Push harder -> Accelerate faster. Heavier object -> Accelerates slower."
            },
            {
                "id": 3,
                "category": "High-Frequency Exam Trap",
                "front": "Why don't Action and Reaction forces cancel each other out?",
                "back": "Because they act on TWO DIFFERENT BODIES! Action acts on Body A, Reaction acts on Body B. They can never cancel because they are not applied to the same system.",
                "formula": r"\vec{F}_{AB} = -\vec{F}_{BA}",
                "memory_hook": "When you jump from a skateboard: force on skateboard pushes board back; force on feet pushes you forward!"
            },
            {
                "id": 4,
                "category": "Experimental Paradox",
                "front": "Why do heavy bowling balls and light feathers fall at the same speed in vacuum?",
                "back": "Even though gravity pulls 10x harder on the heavy ball (F = 10 mg), the heavy ball also has 10x more mass resisting acceleration (m = 10m). The mass cancels identically: a = (mg)/m = g.",
                "formula": r"a = \frac{m \cdot g}{m} = g = 9.81\text{ m/s}^2",
                "memory_hook": "Greater gravitational pull is perfectly balanced by greater inertial reluctance."
            },
            {
                "id": 5,
                "category": "Calculus Derivation",
                "front": "Impulse-Momentum Theorem",
                "back": "The impulse (integral of force over time) equals the change in linear momentum.",
                "formula": r"\vec{J} = \int_{t_1}^{t_2} \vec{F} \, dt = \Delta \vec{p} = m\vec{v}_2 - m\vec{v}_1",
                "memory_hook": "Airbags increase the impact duration Δt, which drastically reduces the peak force F applied to your body!"
            },
            {
                "id": 6,
                "category": "Boundary Condition",
                "front": "What happens when Mass is Variable (e.g. Rocket)?",
                "back": "F = ma is incomplete! You must use the full product rule: F_ext = m(dv/dt) + v_rel(dm/dt) which yields the Tsiolkovsky rocket equation.",
                "formula": r"\Delta v = v_{\text{exhaust}} \ln\left(\frac{m_0}{m_f}\right)",
                "memory_hook": "Fuel burns away -> rocket gets lighter -> acceleration increases exponentially toward burnout."
            }
        ]
    elif any(k in topic_clean for k in ["transformer", "ai", "attention", "neural", "deep learning"]):
        cards = [
            {
                "id": 1,
                "category": "Architecture",
                "front": "What is Self-Attention in Transformers?",
                "back": "A mechanism that calculates pairwise compatibility weights between all tokens in a sequence, allowing the model to attend to relevant context regardless of distance.",
                "formula": r"\text{Attention}(Q,K,V) = \text{Softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V",
                "memory_hook": "Q asks a question, K provides key index, V returns information."
            },
            {
                "id": 2,
                "category": "Hyperparameter",
                "front": "Why divide by √d_k in Scaled Dot-Product Attention?",
                "back": "For large dimensions d_k, the dot product grows large in magnitude, pushing softmax into regions with extremely small gradients. Scaling prevents vanishing gradients.",
                "formula": r"\text{Scale factor} = \frac{1}{\sqrt{d_k}}",
                "memory_hook": "Tames high variance before applying exponential softmax."
            },
            {
                "id": 3,
                "category": "Component",
                "front": "Why are Positional Encodings required?",
                "back": "Because Transformers process all tokens in parallel with no inherent sequential recurrence (unlike RNNs). Without positional vectors, word order is completely lost.",
                "formula": r"PE_{(pos, 2i)} = \sin(pos / 10000^{2i/d_{\text{model}}})",
                "memory_hook": "Provides timestamps for each word in the parallel attention stream."
            }
        ]
    else:
        cards = [
            {
                "id": 1,
                "category": "Foundational Concept",
                "front": f"Core Principle of {topic.title()}",
                "back": f"The foundational operational framework that governs state transitions, inputs, and observed outputs in {topic}.",
                "formula": r"\text{Input} \longrightarrow \mathcal{T}[\text{Process}] \longrightarrow \text{Equilibrium}",
                "memory_hook": "Identify inputs, primary transformation mechanism, and final stable outcome."
            },
            {
                "id": 2,
                "category": "Exam Rule",
                "front": f"Key Law & Conservation in {topic.title()}",
                "back": "Every energetic or state change obeys total conservation invariants across closed system boundaries.",
                "formula": r"\Delta E_{\text{system}} = 0 \quad (\text{Closed boundary})",
                "memory_hook": "Always check boundary conditions before applying standard formulas."
            }
        ]

    return {"topic": topic, "level": level, "total_cards": len(cards), "flashcards": cards}

@app.get("/api/exam-cheat-sheet")
def get_exam_cheat_sheet(topic: Optional[str] = "physics", level: Optional[str] = "basic"):
    """
    1-Click Exam Prep Summary Sheet (High-Yield Formulas, Common Exam Traps, Solved Practice Problems).
    """
    topic_clean = (topic or "").lower()

    if any(k in topic_clean for k in ["newton", "force", "motion", "inertia", "physic"]):
        cheat_sheet = {
            "topic": "Newton's Laws of Motion & Dynamics",
            "exam_badge": "High Yield • 95%+ Board / JEE Frequency",
            "key_formulas": [
                {"name": "Newton's Second Law", "equation": "F_net = m · a", "si_units": "Newton (N) = kg·m/s²", "note": "Valid when mass is constant."},
                {"name": "Impulse-Momentum", "equation": "J = F_avg · Δt = Δp", "si_units": "N·s or kg·m/s", "note": "Area under F-t curve."},
                {"name": "Kinetic Friction", "equation": "f_k = μ_k · N", "si_units": "Dimensionless μ", "note": "Independent of contact surface area."},
                {"name": "Gravitational Acceleration", "equation": "g = G · M / R²", "si_units": "9.81 m/s²", "note": "Independent of object mass in vacuum."}
            ],
            "common_exam_traps": [
                {
                    "trap": "Thinking Action and Reaction Cancel Out",
                    "explanation": "Exam question will ask 'Why does a horse move a cart if forces are equal and opposite?' Answer: They act on two different bodies (horse acts on cart, cart acts on horse; horse pushes ground backward, ground pushes horse forward).",
                    "severity": "CRITICAL"
                },
                {
                    "trap": "Confusing Velocity with Net Force",
                    "explanation": "If a body moves with constant velocity, net force is ZERO, not positive! Force causes acceleration (speed change), not speed itself.",
                    "severity": "HIGH"
                },
                {
                    "trap": "Forgetting Weight Changes in Accelerating Elevators",
                    "explanation": "Apparent weight N = m(g + a) when accelerating upward; N = m(g - a) when accelerating downward; N = 0 in free fall.",
                    "severity": "MEDIUM"
                }
            ],
            "solved_practice_problems": [
                {
                    "problem": "A 1,200 kg car traveling at 20 m/s brakes to a stop over a distance of 40 m. Find the braking force.",
                    "solution_steps": [
                        "Use kinematics equation: v² = u² + 2as => 0 = (20)² + 2a(40)",
                        "Solve for acceleration: a = -400 / 80 = -5.0 m/s² (deceleration)",
                        "Apply F = ma: F = 1,200 kg · (-5.0 m/s²) = -6,000 N",
                        "Answer: Braking friction force is 6,000 Newtons opposing motion."
                    ]
                }
            ],
            "rapid_revision_mnemonics": [
                "F = ma : 'Fast Motor Acceleration'",
                "3rd Law : 'Different bodies never cancel each other'"
            ]
        }
    else:
        cheat_sheet = {
            "topic": topic.title(),
            "exam_badge": "High Yield Revision Sheet",
            "key_formulas": [
                {"name": "Fundamental Relationship", "equation": "Output = TransferFunction(Input)", "si_units": "Standard SI Units", "note": "Core operational model."}
            ],
            "common_exam_traps": [
                {"trap": "Confusing steady-state with transient state", "explanation": "Always identify if system has achieved equilibrium.", "severity": "HIGH"}
            ],
            "solved_practice_problems": [
                {
                    "problem": f"Sample analytical application of {topic.title()}.",
                    "solution_steps": ["Analyze initial boundary conditions", "Apply conservation laws", "Verify dimensions and units"]
                }
            ],
            "rapid_revision_mnemonics": ["Inspect -> Hypothesize -> Solve -> Verify"]
        }

    return cheat_sheet

@app.post("/api/render-video")
def render_video(req: RenderVideoRequest):
    video_url = media_pipeline.render_lesson_video(
        concept_title=req.concept_title,
        audio_path=req.audio_path,
        duration=req.duration_seconds,
        output_filename=req.output_filename
    )
    return {"video_url": video_url}

@app.post("/api/evaluate-answer")
def evaluate_answer(req: AnswerRequest):
    evaluation = assessment_engine.evaluate_answer(
        question=req.question,
        student_answer=req.student_answer
    )
    return {"evaluation": evaluation}

@app.post("/api/final-report")
def create_final_report(req: FinalReportRequest):
    report = assessment_engine.generate_final_report(req.session_data)
    
    # Persist in student profile store
    learner_store.record_session(req.learner_id, {
        "session_id": f"sess_{uuid.uuid4().hex[:8]}",
        "topic": report["topic"],
        "duration_minutes": req.session_data.get("duration_minutes", 20),
        "score": report["overall_score"],
        "language": req.session_data.get("language", "en"),
        "concepts_mastered": report["concepts_mastered"],
        "misconceptions": req.session_data.get("misconceptions_found", [])
    })

    return {"report": report}

@app.get("/api/learner-profile")
def get_learner_profile(learner_id: str = "default_student"):
    profile = learner_store.get_profile(learner_id)
    return {"profile": profile}

@app.get("/api/learning-path")
def get_learning_path(topic: Optional[str] = "physics", doc_id: Optional[str] = None):
    chunks = rag_engine.documents.get(doc_id, []) if doc_id else []
    path = learning_path_generator.generate_or_get_path(topic=topic or "physics", doc_id=doc_id, chunks=chunks)
    return {"learning_path": path}

@app.get("/api/debug/rag")
def debug_rag(query: str = Query(...), doc_id: Optional[str] = None, top_k: int = 4):
    """
    Debug endpoint for evaluating RAG provenance, citation attribution, and similarity scores.
    """
    return rag_engine.retrieve(query=query, doc_id=doc_id, top_k=top_k)

@app.get("/api/rag-provenance")
def get_rag_provenance(query: Optional[str] = None, doc_id: Optional[str] = None, top_k: int = 6):
    """
    Real-time document grounding endpoint.
    Retrieves verified source chunks for the current concept, topic, or document.
    """
    clean_q = query.strip() if query and query.strip() else ""
    
    # If a specific doc_id is active, prioritize chunks from this document
    if doc_id and doc_id in rag_engine.documents:
        all_doc_chunks = rag_engine.documents[doc_id]
        if not clean_q:
            formatted = []
            for c in all_doc_chunks[:top_k]:
                formatted.append({
                    "chunk_id": c.get("chunk_id", "c1"),
                    "source_file": c.get("source_file", doc_id),
                    "page_number": c.get("page_number", 1),
                    "section_title": c.get("section_title", ""),
                    "text": c.get("text", ""),
                    "relevance_score": 0.95
                })
            return {
                "is_grounded": True,
                "confidence_framing": "high_grounded",
                "doc_id": doc_id,
                "total_indexed": len(all_doc_chunks),
                "retrieved_chunks": formatted
            }

    effective_query = clean_q or "core concepts overview"
    return rag_engine.retrieve(query=effective_query, doc_id=doc_id, top_k=top_k)

def _generate_local_fallback_quiz(topic: str, chunks: List[Dict[str, Any]], count: int = 10, language: str = "en") -> List[Dict[str, Any]]:
    questions = []
    text_pool = [c.get("text", "") for c in chunks if len(c.get("text", "")) > 30]
    
    for i in range(1, count + 1):
        chunk_text = text_pool[(i - 1) % len(text_pool)] if text_pool else f"Core principle of {topic}"
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', chunk_text) if len(s.strip()) > 15]
        first_s = sentences[0] if sentences else f"Understanding {topic}"
        key_words = [w for w in re.findall(r'\b[A-Za-z]{4,}\b', chunk_text) if w.lower() not in ['this', 'that', 'with', 'from', 'have', 'were', 'which', 'their']]
        focus_term = key_words[(i - 1) % len(key_words)].capitalize() if key_words else f"Concept {i}"

        if language == "hi":
            q_text = f"प्रश्न {i}: '{topic}' के संदर्भ में '{focus_term}' का क्या मुख्य महत्व है?"
            opt_a = f"{focus_term} इस विषय की मुख्य कार्यप्रणाली का आधार है।"
            opt_b = f"{focus_term} का इस विषय से कोई संबंध नहीं है।"
            opt_c = f"{focus_term} प्रक्रिया को हमेशा धीमा या बंद कर देता है।"
            opt_d = f"{focus_term} केवल एक काल्पनिक धारणा है।"
        elif language == "hinglish":
            q_text = f"Question {i}: '{topic}' mein '{focus_term}' ka primary role kya hota hai?"
            opt_a = f"{focus_term} core mechanism aur conceptual foundation provide karta hai."
            opt_b = f"{focus_term} ka system par koi impact ya relevance nahi hota."
            opt_c = f"{focus_term} pure process ko completely disrupt kar deta hai."
            opt_d = f"{focus_term} sirf ek optional theoretical term hai."
        else:
            q_text = f"Question {i}: What is the primary role of '{focus_term}' regarding {topic}?"
            opt_a = f"{focus_term} functions as a foundational mechanism in this domain."
            opt_b = f"{focus_term} has zero active influence on the observed system."
            opt_c = f"{focus_term} directly negates the primary operating principle."
            opt_d = f"{focus_term} is strictly an obsolete historical hypothesis."

        # Rotate correct option position (A, B, C, D) so it varies across questions
        correct_index = (i - 1) % 4
        distractors = [opt_b, opt_c, opt_d]
        final_options = distractors[:correct_index] + [opt_a] + distractors[correct_index:]
        letter = ["A", "B", "C", "D"][correct_index]

        if language == "hi":
            expl = f"सही उत्तर {letter} है क्योंकि: {first_s}"
        elif language == "hinglish":
            expl = f"Option {letter} is correct because: {first_s}"
        else:
            expl = f"Option {letter} is correct. As noted in the material: {first_s}"

        questions.append({
            "id": i,
            "question": q_text,
            "options": final_options,
            "correct_idx": correct_index,
            "explanation": expl,
            "difficulty": "easy" if i <= 3 else ("medium" if i <= 7 else "hard")
        })

    return questions

@app.post("/api/generate-quiz")
def generate_quiz(req: QuizRequest):
    """
    Generates an interactive 10-question quiz grounded in the current topic or uploaded document.
    """
    # Ground quiz questions in document chunks or topic
    logger.info(f"Generating quiz for topic: {req.topic}, doc_id: {req.doc_id}")
    all_chunks = rag_engine.documents.get(req.doc_id, []) if req.doc_id else []
    if not all_chunks:
        retrieval = rag_engine.retrieve(query=req.topic, doc_id=req.doc_id, top_k=8)
        all_chunks = retrieval.get("retrieved_chunks", [])

    combined_text = "\n\n".join([c.get("text", "") for c in all_chunks[:10]])
    quiz_questions = None

    if gemini_service.is_available():
        try:
            quiz_questions = gemini_service.generate_quiz(
                text=combined_text,
                topic=req.topic,
                count=req.count or 10,
                language=req.language or "en"
            )
        except Exception as e:
            logger.warning(f"Gemini quiz generation error, using fallback: {e}")
            quiz_questions = None

    # Guaranteed fallback: 10 instant document-grounded questions
    if not quiz_questions or len(quiz_questions) < (req.count or 10):
        quiz_questions = _generate_local_fallback_quiz(req.topic, all_chunks, count=req.count or 10, language=req.language or "en")

    return {
        "success": True,
        "topic": req.topic,
        "total_questions": len(quiz_questions),
        "questions": quiz_questions
    }

@app.post("/api/ask-followup")
async def ask_followup(req: FollowUpRequest):
    """
    Handles live student follow-up questions mid-lesson.
    Grounds answer in retrieved source chunks, respects language and level,
    and returns synthesized teacher voice so Dr. Arya speaks the answer.
    """
    # 1. RAG retrieval for question
    retrieval = rag_engine.retrieve(query=req.question, doc_id=req.doc_id, top_k=3)
    chunks = retrieval.get("retrieved_chunks", [])
    
    # 2. Synthesize pedagogical response using Gemini AI or dynamic document grounding
    answer_text = None

    if gemini_service.is_available():
        context_text = "\n\n".join([c.get("text", "") for c in chunks])
        lang_instruction = "Hinglish (mix of Hindi and English)" if req.language == "hinglish" else ("Hindi (हिंदी)" if req.language == "hi" else "English")
        prompt = f"""
You are Dr. Arya, an encouraging and expert AI Teacher.
A student in your class just asked a follow-up question during the lesson on "{req.concept_title}".

Uploaded Study Material / Document Context:
{context_text[:3000] if context_text else 'General instructional principles on ' + req.concept_title}

Student's Question: "{req.question}"
Language to reply in: {lang_instruction}

Instructions:
1. Answer the question directly, accurately, and encouragingly in {lang_instruction}.
2. Base your explanation strictly on the topic "{req.concept_title}" and the uploaded context above.
3. NEVER mention Newton, Galileo, Inertia, or physics unless the topic is actually about them.
4. Keep the answer concise (2-4 clear sentences) so it sounds natural when spoken aloud.
"""
        ai_resp = gemini_service.generate_content(prompt)
        if ai_resp and len(ai_resp.strip()) > 15:
            answer_text = ai_resp.strip()

    # Dynamic fallback if Gemini is offline
    if not answer_text:
        snippet = chunks[0].get("text", "").strip()[:200] if chunks else f"the core principles of {req.concept_title}"
        if req.language == "hi":
            answer_text = (
                f"बहुत अच्छा सवाल! आपके पूछे गए प्रश्न '{req.question}' के संदर्भ में: "
                f"आपके दस्तावेज़ के अनुसार, {snippet}। "
                f"क्या यह बिंदु अब स्पष्ट है?"
            )
        elif req.language == "hinglish":
            answer_text = (
                f"Great question! Aapne poocha: '{req.question}'. "
                f"Aapke uploaded material ke mutabiq, {snippet}. "
                f"I hope this clarifies your doubt on {req.concept_title}!"
            )
        else:
            answer_text = (
                f"That is a great question regarding '{req.question}'. "
                f"Based on your material for {req.concept_title}: {snippet}. "
                f"I hope this helps clarify the concept!"
            )

    # 3. Synthesize neural speech for the teacher's verbal response
    speech_res = await media_pipeline.synthesize_speech(text=answer_text, language=req.language)

    return {
        "question": req.question,
        "answer_text": answer_text,
        "audio_url": speech_res.get("audio_url"),
        "duration_seconds": speech_res.get("duration_seconds"),
        "citations": [
            {
                "chunk_id": c.get("chunk_id"),
                "source_file": c.get("source_file"),
                "page": c.get("page_number", 1),
                "text_snippet": c.get("text", "")[:120] + "..."
            }
            for c in chunks
        ],
        "is_grounded": retrieval.get("is_grounded", True)
    }

@app.post("/api/render-video")
def render_video(req: RenderVideoRequest):
    """
    Renders an animated educational tutorial video for the current concept.
    """
    logger.info(f"Rendering lesson video for: {req.concept_title}")
    resolved_audio = req.audio_path
    
    # Try resolving audio file location
    if not resolved_audio or not os.path.exists(resolved_audio):
        # Look in settings.audio_dir
        audio_files = list(settings.audio_dir.glob("*.mp3"))
        if audio_files:
            resolved_audio = str(audio_files[0])
        else:
            resolved_audio = str(settings.audio_dir / "fallback.mp3")

    video_url = media_pipeline.render_lesson_video(
        concept_title=req.concept_title,
        audio_path=resolved_audio,
        duration=req.duration_seconds or 15.0,
        output_filename=req.output_filename
    )
    return {
        "success": True,
        "video_url": video_url,
        "filename": req.output_filename,
        "concept_title": req.concept_title
    }

@app.post("/api/generate-video-prompt")
def generate_video_prompt(req: VideoPromptRequest):
    """
    Generates the exact Studio Text-to-Video Master Style prompt (Sora / Veo / Runway Gen)
    tailored to the current concept and subject visual reasoning.
    """
    master_style = (
        "A photorealistic professional woman with dark hair pulled back, wearing a "
        "grey business blazer, standing centered in a futuristic high-tech studio. "
        "The room has pale grey paneled walls outlined with glowing cyan-white neon "
        "strip lighting along every edge and doorway, a smooth reflective floor, and "
        "dim server racks with small blinking blue and green lights visible in the "
        "background. The lighting is cool and clean — soft studio light on her face, "
        "cyan glow bouncing off the walls and floor. She speaks naturally to camera "
        "with calm, confident, professional body language and light hand gestures. "
        "Medium shot, chest-up framing, camera centered and level, subtle slow push-in. "
        "Cinematic, high production value, sharp focus on her, soft background blur. "
        "No text artifacts, no distorted hands, no flickering."
    )

    clip_a = (
        f"{master_style}\n\n"
        f"She is mid-sentence, introducing and explaining '{req.concept_title}' with light, "
        f"natural hand gestures. Her expression is warm, encouraging, and pedagogically engaged, "
        f"like a master teacher addressing an individual student directly. 8 seconds, steady slow push-in, no camera shake."
    )

    panel_desc = "a dynamic vector diagram showing applied force arrows in cyan and friction vectors in rose"
    if req.visual_type == "EQUATION":
        panel_desc = "step-by-step glowing LaTeX formulas expanding F_net = dp/dt = m*a with illuminated mathematical symbols"
    elif req.visual_type == "FLOWCHART_PROCESS":
        panel_desc = "a biochemical process cycle highlighting thylakoid light absorption and photolysis of water in glowing emerald lines"
    elif req.visual_type == "CODE_TRACE":
        panel_desc = "a clean monospace code editor displaying an adjacent swapping algorithm with an illuminated cyan pointer"

    clip_b = (
        f"{master_style}\n\n"
        f"To her left, a translucent holographic panel materializes in the air with a soft glowing "
        f"cyan-white border and sharp corner brackets, like a sci-fi educational HUD interface. "
        f"A small glowing label reads 'AI TEACHER' in the top corner of the panel. Inside the panel: "
        f"{panel_desc}. The camera slowly dollies toward the panel as it appears, keeping the woman "
        f"partially in frame at the edge. Smooth holographic materialize animation, no hard cuts. 8 seconds."
    )

    clip_c = (
        f"{master_style}\n\n"
        f"The holographic panel from the previous shot fades out softly. Camera settles back to a centered "
        f"medium shot on her. She leans in very slightly, asking a direct concept checkpoint question to the viewer "
        f"about '{req.concept_title}' with an open, curious expression and open-palm hand gesture, as if checking "
        f"whether the student mastered the intuition. 6 seconds."
    )

    return {
        "concept_title": req.concept_title,
        "master_style_prompt": master_style,
        "clip_a_talking_shot": clip_a,
        "clip_b_holographic_panel": clip_b,
        "clip_c_checkpoint_return": clip_c
    }

@app.get("/api/comparison-plans")
def get_comparison_plans():
    """
    Returns pre-generated 5-min, 20-min, and 60-min lesson plans demonstrating
    observable time-budget and level structural adaptation on the same topic.
    """
    import json
    data_dir = settings.data_dir
    results = {}
    for t in [5, 20, 60]:
        fpath = data_dir / f"comparison_{t}min.json"
        if fpath.exists():
            with open(fpath, "r", encoding="utf-8") as f:
                results[f"{t}min"] = json.load(f)
    return results


# =====================================================================
# LIVE AI CLASSROOM ENDPOINTS & WEBSOCKET ENGINE
# =====================================================================

class LiveClassStartRequest(BaseModel):
    session_id: Optional[str] = None
    doc_id: Optional[str] = "operating_systems"
    topic: Optional[str] = "Process Management"
    level: Optional[str] = "beginner"
    language: Optional[str] = "hinglish"
    duration: Optional[int] = 20
    goal: Optional[str] = "Semester Exam"
    tutor_gender: Optional[str] = "female"
    persona: Optional[str] = "friendly"

class LiveClassInterruptRequest(BaseModel):
    session_id: str
    question: str
    audio_base64: Optional[str] = None

class LiveClassControlRequest(BaseModel):
    session_id: str
    action: str  # pause, resume, repeat, next, language, simple, example
    value: Optional[str] = None

class LiveClassAnswerRequest(BaseModel):
    session_id: str
    answer_idx: int

@app.post("/api/live-class/start")
async def start_live_class_endpoint(req: LiveClassStartRequest):
    sess_id = req.session_id or f"live_{uuid.uuid4().hex[:8]}"
    session = live_class_manager.get_or_create_session(
        session_id=sess_id,
        topic=req.topic or "Process Management",
        doc_id=req.doc_id,
        language=req.language or "hinglish",
        difficulty=req.level or "beginner",
        tutor_gender=req.tutor_gender or "female",
        tutor_persona=req.persona or "friendly"
    )
    asyncio.create_task(live_class_manager.start_live_class(session))
    return {
        "success": True,
        "session_id": sess_id,
        "session": session.to_dict()
    }

@app.post("/api/live-class/interrupt")
async def interrupt_live_class_endpoint(req: LiveClassInterruptRequest):
    session = live_class_manager.sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Live session not found")
    asyncio.create_task(live_class_manager.handle_student_interruption(session, req.question))
    return {"success": True, "status": "interruption_received", "session_id": req.session_id}

@app.post("/api/live-class/next-section")
async def next_section_endpoint(req: Dict[str, str]):
    session_id = req.get("session_id")
    session = live_class_manager.sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Live session not found")
    asyncio.create_task(live_class_manager.advance_to_next_section(session))
    return {"success": True, "status": "advancing"}

@app.post("/api/live-class/control")
async def control_live_class_endpoint(req: LiveClassControlRequest):
    session = live_class_manager.sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Live session not found")
    action = req.action.lower()
    if action == "pause":
        session.teacher_state = "IDLE"
        session.is_speaking = False
        await live_class_manager.broadcast_event(session, "teacher_state_changed", {"state": "IDLE", "is_speaking": False})
    elif action == "resume":
        session.teacher_state = "EXPLAINING"
        session.is_speaking = True
        await live_class_manager.broadcast_event(session, "teacher_state_changed", {"state": "EXPLAINING", "is_speaking": True})
    elif action == "repeat":
        asyncio.create_task(live_class_manager.present_current_section(session))
    elif action == "next":
        asyncio.create_task(live_class_manager.advance_to_next_section(session))
    elif action == "language" and req.value:
        session.language = req.value
        await live_class_manager.broadcast_event(session, "language_changed", {"language": req.value})
        asyncio.create_task(live_class_manager.present_current_section(session))
    elif action == "simple":
        asyncio.create_task(live_class_manager.handle_student_interruption(session, "Can you explain this more simply with an everyday analogy?"))
    elif action == "example":
        asyncio.create_task(live_class_manager.handle_student_interruption(session, "Can you give a practical real-world example?"))
    return {"success": True, "action": action}

@app.get("/api/live-class/session/{session_id}")
def get_live_class_session_endpoint(session_id: str):
    session = live_class_manager.sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "session": session.to_dict()}

@app.websocket("/ws/live-class/{session_id}")
async def live_class_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = live_class_manager.get_or_create_session(session_id)
    if websocket not in session.connections:
        session.connections.append(websocket)
    logger.info(f"WebSocket student connected to live session {session_id}")
    try:
        await websocket.send_text(json.dumps({
            "event": "session_connected",
            "data": session.to_dict(),
            "timestamp": datetime.utcnow().isoformat()
        }))
        while True:
            msg_text = await websocket.receive_text()
            try:
                msg = json.loads(msg_text)
                event_name = msg.get("event")
                payload = msg.get("data", {})
                if event_name == "student_interrupt":
                    question = payload.get("question", "")
                    await live_class_manager.handle_student_interruption(session, question)
                elif event_name == "advance_section":
                    await live_class_manager.advance_to_next_section(session)
                elif event_name == "ping":
                    await websocket.send_text(json.dumps({"event": "pong"}))
            except Exception as inner_e:
                logger.error(f"Error handling live classroom WS message: {inner_e}")
    except WebSocketDisconnect:
        logger.info(f"WebSocket student disconnected from session {session_id}")
        if websocket in session.connections:
            session.connections.remove(websocket)


