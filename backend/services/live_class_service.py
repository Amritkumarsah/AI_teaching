"""
LIVE CLASSROOM SERVICE
Orchestrates real-time live interactive classroom sessions.
Supports WebSockets, streaming text/audio, instant student interruptions,
PDF RAG Q&A, and adaptive visual synchronization.
"""

import os
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect

try:
    from backend.config import settings
    from backend.services.rag_engine import rag_engine
    from backend.services.media_pipeline import media_pipeline
    from backend.services.gemini_service import gemini_service
    from backend.services.visual_planner import visual_planner
except ImportError:
    from config import settings
    from services.rag_engine import rag_engine
    from services.media_pipeline import media_pipeline
    from services.gemini_service import gemini_service
    from services.visual_planner import visual_planner

logger = logging.getLogger("live_class_service")

class LiveClassSession:
    def __init__(
        self,
        session_id: str,
        topic: str,
        doc_id: Optional[str] = None,
        language: str = "en",
        difficulty: str = "beginner",
        tutor_gender: str = "female",
        tutor_persona: str = "friendly"
    ):
        self.session_id = session_id
        self.topic = topic
        self.doc_id = doc_id
        self.language = language
        self.difficulty = difficulty
        self.tutor_gender = tutor_gender
        self.tutor_persona = tutor_persona

        # Live State Machine: IDLE, LISTENING, THINKING, SPEAKING, EXPLAINING, ASKING, WAITING_FOR_STUDENT
        self.teacher_state = "IDLE"
        self.is_speaking = False
        self.current_section_idx = 0
        self.lesson_progress = 0
        self.student_mastery = 0.0
        self.interaction_count = 0

        # Current Lesson Content
        self.sections: List[Dict[str, Any]] = []
        self.current_visual_spec: Dict[str, Any] = {}
        self.current_spoken_text: str = ""
        self.current_audio_url: Optional[str] = None
        self.active_checkpoint: Optional[Dict[str, Any]] = None

        # Interruption tracking
        self.interrupted = False
        self.active_task: Optional[asyncio.Task] = None

        # Connected WebSockets
        self.connections: List[WebSocket] = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "topic": self.topic,
            "doc_id": self.doc_id,
            "language": self.language,
            "difficulty": self.difficulty,
            "tutor_gender": self.tutor_gender,
            "tutor_persona": self.tutor_persona,
            "teacher_state": self.teacher_state,
            "is_speaking": self.is_speaking,
            "current_section_idx": self.current_section_idx,
            "lesson_progress": self.lesson_progress,
            "student_mastery": self.student_mastery,
            "interaction_count": self.interaction_count,
            "current_spoken_text": self.current_spoken_text,
            "current_audio_url": self.current_audio_url,
            "visual_spec": self.current_visual_spec,
            "checkpoint": self.active_checkpoint
        }


class LiveClassManager:
    """
    Manages active live sessions across connected students.
    """
    def __init__(self):
        self.sessions: Dict[str, LiveClassSession] = {}

    def get_or_create_session(
        self,
        session_id: str,
        topic: str = "Operating Systems",
        doc_id: Optional[str] = None,
        language: str = "en",
        difficulty: str = "beginner",
        tutor_gender: str = "female",
        tutor_persona: str = "friendly"
    ) -> LiveClassSession:
        if session_id not in self.sessions:
            self.sessions[session_id] = LiveClassSession(
                session_id=session_id,
                topic=topic,
                doc_id=doc_id,
                language=language,
                difficulty=difficulty,
                tutor_gender=tutor_gender,
                tutor_persona=tutor_persona
            )
        return self.sessions[session_id]

    async def broadcast_event(self, session: LiveClassSession, event_type: str, data: Dict[str, Any]):
        payload = json.dumps({"event": event_type, "data": data, "timestamp": datetime.utcnow().isoformat()})
        dead_sockets = []
        for ws in session.connections:
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"WebSocket send failure: {e}")
                dead_sockets.append(ws)
        for dead in dead_sockets:
            if dead in session.connections:
                session.connections.remove(dead)

    async def start_live_class(self, session: LiveClassSession):
        """
        Initializes the lesson structure from RAG context, generates the first section,
        plans the first visual, and streams teacher speech.
        """
        logger.info(f"Starting live class session {session.session_id} on {session.topic}")
        session.interrupted = False

        # 1. Retrieve RAG chunks for topic
        retrieval = rag_engine.retrieve(query=session.topic, doc_id=session.doc_id, top_k=5)
        chunks = retrieval.get("retrieved_chunks", [])
        context_text = "\n\n".join([c.get("text", "") for c in chunks])

        # 2. Build structured lesson sections if empty
        if not session.sections:
            if "process" in session.topic.lower() or "operating" in session.topic.lower():
                session.sections = [
                    {
                        "title": "Introduction to Process Management",
                        "summary": "Core definition of a process and the fundamental difference between passive program binaries on disk vs active processes in RAM.",
                        "concept": "Process vs Program",
                        "checkpoint": {
                            "question": "Why is a program on your hard disk considered a passive entity, whereas a process in RAM is active?",
                            "options": [
                                "Because a program on disk has no active program counter or CPU registers executing until loaded into memory.",
                                "Because programs cannot be written in modern programming languages.",
                                "Because processes do not require any CPU hardware cycles.",
                                "Because hard drives run at higher clock speeds than RAM."
                            ],
                            "correct_idx": 0,
                            "explanation": "A program is static code stored on disk. When executed, the OS loads it into RAM with a Program Counter (PC), stack, and PCB, transforming it into an active Process."
                        }
                    },
                    {
                        "title": "Process States & Lifecycle",
                        "summary": "How operating systems cycle processes through New, Ready, Running, Waiting, and Terminated states.",
                        "concept": "Process Lifecycle",
                        "checkpoint": {
                            "question": "When a running process initiates a disk read operation, which state does the OS transition it to?",
                            "options": [
                                "Waiting (Blocked) state, until the I/O operation finishes.",
                                "Terminated state immediately.",
                                "Back to New state.",
                                "It keeps executing on the CPU without pausing."
                            ],
                            "correct_idx": 0,
                            "explanation": "I/O is slow compared to CPU. The OS moves the process to Waiting so other Ready processes can use the CPU."
                        }
                    },
                    {
                        "title": "Process Control Block (PCB) & Context Switch",
                        "summary": "How the kernel saves CPU registers, program counters, and memory tables to switch between processes in microseconds.",
                        "concept": "PCB & Context Switching",
                        "checkpoint": {
                            "question": "What is the primary computational cost of a Context Switch?",
                            "options": [
                                "Saving and restoring hardware registers into the PCB without doing productive user work.",
                                "Permanently deleting the program from disk.",
                                "Restarting the computer motherboard.",
                                "Recompiling the source code from scratch."
                            ],
                            "correct_idx": 0,
                            "explanation": "Context switch time is pure overhead—the CPU spends time saving/loading registers rather than executing user code."
                        }
                    }
                ]
            else:
                session.sections = [
                    {
                        "title": f"Fundamentals of {session.topic}",
                        "summary": context_text[:250] if context_text else f"Introduction to {session.topic}",
                        "concept": session.topic,
                        "checkpoint": {
                            "question": f"What is the foundational governing principle of {session.topic}?",
                            "options": [
                                "It establishes the core architectural framework of the system.",
                                "It has zero impact on operational state.",
                                "It is solely an obsolete hypothesis.",
                                "It completely prevents system execution."
                            ],
                            "correct_idx": 0,
                            "explanation": f"The foundational premise governs how all subcomponents in {session.topic} interact."
                        }
                    }
                ]

        # 3. Present Section 0
        await self.present_current_section(session)

    async def present_current_section(self, session: LiveClassSession):
        """
        Presents the current section:
        1. Set state = EXPLAINING
        2. Plan & broadcast visual specification
        3. Synthesize & stream neural speech
        4. When speech concludes, trigger socratic checkpoint question
        """
        if session.current_section_idx >= len(session.sections):
            session.teacher_state = "IDLE"
            session.lesson_progress = 100
            await self.broadcast_event(session, "lesson_completed", {"summary": "Great job! You have completed all live lesson sections."})
            return

        sec = session.sections[session.current_section_idx]
        session.lesson_progress = int((session.current_section_idx / max(len(session.sections), 1)) * 100)
        session.teacher_state = "EXPLAINING"
        session.is_speaking = True

        # Generate Visual Plan
        visual_spec = visual_planner.plan_visual(
            concept_title=sec.get("concept", sec.get("title", session.topic)),
            domain="os" if ("process" in session.topic.lower() or "operating" in session.topic.lower()) else "general",
            level=session.difficulty,
            context_text=sec.get("summary", ""),
            language=session.language
        )
        session.current_visual_spec = visual_spec

        # Broadcast visual plan to client
        await self.broadcast_event(session, "visual_updated", {"visual_spec": visual_spec, "section_idx": session.current_section_idx})

        # Generate Spoken Explanation
        tutor_name = "Dr. Vikram" if session.tutor_gender == "male" else "Dr. Arya"
        speech_text = self._build_section_script(sec, session, tutor_name)
        session.current_spoken_text = speech_text

        # Broadcast state
        await self.broadcast_event(session, "teacher_state_changed", {
            "state": "EXPLAINING",
            "is_speaking": True,
            "spoken_text": speech_text,
            "tutor_name": tutor_name,
            "tutor_gender": session.tutor_gender,
            "tutor_persona": session.tutor_persona
        })

        # Synthesize Neural Audio
        voice_lang = session.language
        speech_res = await media_pipeline.synthesize_speech(text=speech_text, language=voice_lang)
        audio_url = speech_res.get("audio_url")
        session.current_audio_url = audio_url

        await self.broadcast_event(session, "teacher_speech_ready", {
            "audio_url": f"http://localhost:8000{audio_url}" if audio_url and not audio_url.startswith("http") else audio_url,
            "spoken_text": speech_text,
            "duration_seconds": speech_res.get("duration_seconds", 12.0),
            "viseme_timeline": speech_res.get("viseme_timeline", [])
        })

    def _build_section_script(self, section: Dict[str, Any], session: LiveClassSession, tutor_name: str) -> str:
        title = section.get("title", "")
        summary = section.get("summary", "")
        lang = session.language
        level = session.difficulty

        if lang == "hi":
            if "process" in title.lower():
                return f"नमस्ते! मैं {tutor_name} हूँ। आज हम '{title}' को बहुत बारीकी से समझेंगे। ध्यान दीजिए: जब एक प्रोग्राम डिस्क पर रखा होता है, तो वह केवल एक निष्क्रिय फ़ाइल है। लेकिन जब हम उसे चलाते हैं, तो वह रैम में लोड होकर 'प्रोसेस' बन जाता है। स्क्रीन पर दिए गए डायग्राम को ध्यान से देखिए!"
            return f"नमस्ते! मैं {tutor_name} हूँ। आज हम '{title}' के मुख्य सिद्धांतों को समझेंगे। {summary}। आइए स्क्रीन पर दिए गए 3D मॉडल को एक्सप्लोर करते हैं!"

        elif lang == "hinglish":
            if "process" in title.lower():
                return f"Hello students! I am {tutor_name}. Aaj hum '{title}' explore kar rahe hain. Ek critical difference yaad rakhiye: Program disk par rakhi passive file hoti hai, jabki Process RAM me active execution hai jisme CPU registers aur program counter shamil hote hain. Look at the visual on your screen right now!"
            return f"Welcome! Main {tutor_name} hoon. Aaj hum '{title}' par live class kar rahe hain. Core concept yeh hai: {summary}. Screen par visual ko dhyan se dekhiye!"

        else: # en
            if "process" in title.lower():
                return f"Hello everyone! I am {tutor_name}. Today we are exploring '{title}'. Notice the critical architectural distinction: a program is a passive entity stored on disk, whereas a process is an active entity loaded in memory with an active program counter and registers. Examine the diagram on your screen!"
            return f"Welcome to our live class on '{title}'. I am {tutor_name}. At the foundation: {summary}. Observe the visualization currently rendering on your chalkboard."

    async def handle_student_interruption(self, session: LiveClassSession, question_text: str):
        """
        CRITICAL INTERRUPTION WORKFLOW:
        1. Immediately set interrupted = True
        2. Set teacher_state = 'LISTENING' -> 'THINKING'
        3. Stop current audio on client
        4. Retrieve relevant RAG context
        5. Generate direct pedagogical answer in student's language
        6. Update visual if clarification/comparison is required (e.g. Program vs Process)
        7. Deliver spoken answer
        """
        logger.info(f"Student interrupted live class with question: {question_text}")
        session.interrupted = True
        session.is_speaking = False
        session.interaction_count += 1

        # 1. Broadcast immediate INTERRUPTED state to frontend
        session.teacher_state = "INTERRUPTED"
        await self.broadcast_event(session, "teacher_state_changed", {
            "state": "INTERRUPTED",
            "is_speaking": False,
            "interrupted": True,
            "question": question_text
        })

        await asyncio.sleep(0.15)

        # 2. Transition to LISTENING
        session.teacher_state = "LISTENING"
        await self.broadcast_event(session, "teacher_state_changed", {
            "state": "LISTENING",
            "is_speaking": False,
            "interrupted": True,
            "question": question_text
        })

        # 3. Transition to THINKING
        await asyncio.sleep(0.3)
        session.teacher_state = "THINKING"
        await self.broadcast_event(session, "teacher_state_changed", {
            "state": "THINKING",
            "is_speaking": False,
            "interrupted": True,
            "question": question_text
        })

        # 3. Retrieve RAG chunks for question
        retrieval = rag_engine.retrieve(query=question_text, doc_id=session.doc_id, top_k=3)
        chunks = retrieval.get("retrieved_chunks", [])
        context_str = "\n".join([c.get("text", "") for c in chunks])

        # 4. Synthesize direct pedagogical answer
        tutor_name = "Dr. Vikram" if session.tutor_gender == "male" else "Dr. Arya"
        answer_text = None

        q_lower = question_text.lower()
        if "difference" in q_lower or ("process" in q_lower and "program" in q_lower):
            # Dedicated expert answer for Process vs Program
            if session.language == "hi":
                answer_text = (
                    f"बहुत ही महत्वपूर्ण सवाल! देखिए, 'Program' और 'Process' में मुख्य अंतर यह है: "
                    f"Program हार्ड डिस्क पर रखी एक निष्क्रिय (passive) फ़ाइल है—जैसे MS Word या chrome.exe। "
                    f"लेकिन जब आप उस पर डबल-क्लिक करते हैं, तो OS उसे RAM में लोड करता है और वह सक्रिय (active) 'Process' बन जाती है। "
                    f"स्क्रीन पर देखिए, मैंने आपके लिए Program vs Process का कंपैरिजन चार्ट लोड कर दिया है!"
                )
            elif session.language == "hinglish":
                answer_text = (
                    f"Bohot badhiya sawaal! Dekhiye, 'Program' aur 'Process' me main difference yeh hai: "
                    f"Program secondary storage yani hard disk par stored ek passive binary file hai—jaise MS Word ya code file. "
                    f"Lekin jab aap use execute karte hain, toh OS use RAM me load karta hai, use ek Program Counter aur PCB deta hai, aur wo ek active 'Process' ban jati hai. "
                    f"Screen par dekhiye, maine aapke liye Program vs Process ka clear comparison chart open kar diya hai!"
                )
            else:
                answer_text = (
                    f"That is an essential question! The core distinction is that a Program is a passive entity stored on disk—such as an executable file. "
                    f"A Process is an active entity loaded into RAM with a program counter, stack, and PCB executing instructions. "
                    f"Look at the screen: I have loaded the Program vs Process comparison visual for you!"
                )

            # Update visual to Comparison
            comparison_spec = visual_planner.plan_visual("Program vs Process", domain="os", context_text="Process vs Program comparison")
            session.current_visual_spec = comparison_spec
            session.teacher_state = "ADAPTING"
            await self.broadcast_event(session, "teacher_state_changed", {
                "state": "ADAPTING",
                "is_speaking": False,
                "adaptation_mode": "comparison_table"
            })
            await self.broadcast_event(session, "visual_updated", {"visual_spec": comparison_spec})

        else:
            # General Question Answer via Gemini or dynamic RAG synthesis
            session.teacher_state = "ADAPTING"
            await self.broadcast_event(session, "teacher_state_changed", {
                "state": "ADAPTING",
                "is_speaking": False
            })
            if gemini_service.is_available():
                prompt = f"""
You are {tutor_name}, an encouraging and expert AI tutor conducting a live interactive class on {session.topic}.
A student just interrupted your live speech to ask: "{question_text}".

Uploaded Textbook Context:
{context_str[:2500]}

Language to respond in: {"Hinglish (mix of Hindi & English)" if session.language == "hinglish" else ("Hindi" if session.language == "hi" else "English")}.
Difficulty level: {session.difficulty}.

Instructions:
1. Directly, warmly, and accurately answer their question in 2-3 clear sentences.
2. Ground your answer in the textbook context above.
3. Conclude with a warm check: "Kya yeh point ab clear hai? Shall we continue?"
"""
                ai_resp = gemini_service.generate_content(prompt)
                if ai_resp and len(ai_resp.strip()) > 15:
                    answer_text = ai_resp.strip()

            if not answer_text:
                snippet = chunks[0].get("text", "")[:180] if chunks else f"the foundational principles of {session.topic}"
                if session.language == "hi":
                    answer_text = f"अच्छा सवाल! आपके प्रश्न '{question_text}' के संदर्भ में: {snippet}। क्या यह बिंदु अब स्पष्ट है?"
                elif session.language == "hinglish":
                    answer_text = f"Great question! Aapne poocha '{question_text}'. Aapke material ke mutabiq: {snippet}. I hope this clears your doubt!"
                else:
                    answer_text = f"Great question regarding '{question_text}'. Based on your study material: {snippet}. Does this clarify the concept?"

        # 5. Deliver spoken answer
        session.teacher_state = "EXPLAINING"
        session.is_speaking = True
        session.current_spoken_text = answer_text

        await self.broadcast_event(session, "teacher_state_changed", {
            "state": "EXPLAINING",
            "is_speaking": True,
            "spoken_text": answer_text,
            "is_answer": True
        })

        speech_res = await media_pipeline.synthesize_speech(text=answer_text, language=session.language)
        audio_url = speech_res.get("audio_url")
        session.current_audio_url = audio_url

        await self.broadcast_event(session, "teacher_speech_ready", {
            "audio_url": f"http://localhost:8000{audio_url}" if audio_url and not audio_url.startswith("http") else audio_url,
            "spoken_text": answer_text,
            "duration_seconds": speech_res.get("duration_seconds", 10.0),
            "viseme_timeline": speech_res.get("viseme_timeline", []),
            "is_interruption_response": True
        })

    async def advance_to_next_section(self, session: LiveClassSession):
        """
        Advances the lesson to the next sequential section.
        """
        session.current_section_idx += 1
        await self.present_current_section(session)


live_class_manager = LiveClassManager()
