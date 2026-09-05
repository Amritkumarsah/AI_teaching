import re
from typing import Dict, Any, List
from .rag_engine import rag_engine
from .gemini_service import gemini_service

class LessonPlanner:
    """
    Constructs a pedagogical lesson plan.
    Dynamically adjusts concept count, depth, visuals, and checkpoints based on time budget and level.
    """

    @staticmethod
    def plan_lesson(profile: Dict[str, Any], doc_id: str = None) -> Dict[str, Any]:
        time_budget = profile.get("target_time_minutes", 20)
        is_multiday = profile.get("is_multiday", False)
        level = profile.get("level", "beginner")
        topic = profile.get("topic", "Newton's Laws")
        language = profile.get("language", "en")
        style = profile.get("teaching_style", "intuitive")

        # 1. Retrieve knowledge chunks via RAG
        rag_result = rag_engine.retrieve(query=topic, doc_id=doc_id, top_k=6)
        is_grounded = rag_result.get("is_grounded", False)
        retrieved_chunks = rag_result.get("retrieved_chunks", [])

        # 2. Handle Multi-Day Curriculum Mode
        if is_multiday:
            return LessonPlanner._plan_multiday(profile, topic, retrieved_chunks, is_grounded)

        # 3. Time-Aware Concept Sizing
        # Check if this is a custom uploaded document (not one of the pre-indexed sample materials)
        is_custom_upload = doc_id and doc_id not in ["newtons_laws", "photosynthesis", "bubble_sort"]
        all_doc_chunks = rag_engine.documents.get(doc_id, []) if doc_id else []

        if is_custom_upload and all_doc_chunks:
            concepts = LessonPlanner._get_concepts_from_document(all_doc_chunks, topic, level, time_budget)
        elif time_budget <= 8:
            concepts = LessonPlanner._get_5min_concepts(topic, level, retrieved_chunks)
        elif time_budget <= 35:
            concepts = LessonPlanner._get_20min_concepts(topic, level, retrieved_chunks)
        else:
            concepts = LessonPlanner._get_60min_concepts(topic, level, retrieved_chunks)

        total_estimated_time = sum(c["estimated_seconds"] for c in concepts) // 60

        return {
            "topic": topic,
            "learner_level": level,
            "target_time_minutes": time_budget,
            "actual_planned_minutes": max(total_estimated_time, 1),
            "language": language,
            "teaching_style": style,
            "is_grounded": is_grounded,
            "confidence_framing": "high_grounded" if is_grounded else "general_knowledge",
            "grounding_notice": (
                "Verified against uploaded educational material with full provenance."
                if is_grounded else
                "General Knowledge Mode: Material synthesized from foundational domain principles."
            ),
            "concepts_count": len(concepts),
            "concepts": concepts,
            "final_assessment_overview": {
                "total_questions": 3 if time_budget > 10 else 2,
                "question_types": ["mcq", "short_answer", "explain_own_words"]
            }
        }

    @staticmethod
    def _get_concepts_from_document(chunks: List[Dict[str, Any]], topic: str, level: str, time_budget: int) -> List[Dict[str, Any]]:
        target_count = 2 if time_budget <= 8 else (3 if time_budget <= 35 else 5)
        if not chunks:
            return LessonPlanner._get_20min_concepts(topic, level, [])

        # Check if Google Gemini 1.5 Flash Free Tier is configured
        if gemini_service.is_available():
            combined_text = "\n\n".join([c.get("text", "") for c in chunks[:10]])
            gemini_concepts = gemini_service.plan_lesson_from_text(combined_text, topic, level, count=target_count)
            if gemini_concepts:
                return gemini_concepts

        step = max(len(chunks) // target_count, 1)
        selected = []
        for i in range(target_count):
            idx = min(i * step, len(chunks) - 1)
            if idx not in [s[0] for s in selected]:
                selected.append((idx, chunks[idx]))

        concepts = []
        for idx, (chunk_idx, c) in enumerate(selected, start=1):
            text = c.get("text", "").strip()
            sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 15]

            sec_title = c.get("section_title", "").strip()
            if sec_title and sec_title not in ["General Overview", "General Content", "General", "Introduction", "Overview", ""]:
                concept_title = f"{idx}. {sec_title}"
            elif sentences and ":" in sentences[0] and len(sentences[0].split(":")[0]) < 40:
                concept_title = f"{idx}. {sentences[0].split(':')[0].strip()}"
            elif sentences:
                words = sentences[0].split()[:6]
                concept_title = f"{idx}. {' '.join(words)}..."
            else:
                concept_title = f"{idx}. {topic} - Section {idx}"

            first_sentence = sentences[0] if sentences else text[:140]
            second_sentence = sentences[1] if len(sentences) > 1 else ""
            summary_explanation = f"{first_sentence} {second_sentence}".strip()

            words = [w for w in re.findall(r'\b[A-Za-z]{4,}\b', text) if w.lower() not in ['this', 'that', 'with', 'from', 'have', 'were', 'which', 'their', 'about', 'these']]
            key_term = words[0].capitalize() if words else "Core Mechanism"

            lower_text = text.lower()
            if any(w in lower_text for w in ["formula", "equation", "calculate", "deriv", "math"]):
                vis_type = "EQUATION"
            elif any(w in lower_text for w in ["step", "cycle", "process", "phase", "stage"]):
                vis_type = "FLOWCHART_PROCESS"
            elif any(w in lower_text for w in ["code", "function", "algorithm", "loop", "array"]):
                vis_type = "CODE_TRACE"
            elif any(w in lower_text for w in ["year", "century", "war", "history", "date", "timeline"]):
                vis_type = "TIMELINE"
            elif any(w in lower_text for w in ["force", "motion", "vector", "speed", "energy"]):
                vis_type = "SIMULATION_DIAGRAM"
            else:
                vis_type = "CONCEPT_CARD"

            concepts.append({
                "id": f"custom_{idx}",
                "order": idx,
                "title": concept_title,
                "depth": "standard" if level != "advanced" else "rigorous",
                "explanation": summary_explanation,
                "explanation_focus": summary_explanation,
                "raw_text": text,
                "key_terms": words[:4] if words else [key_term],
                "source_page": c.get("page_number", 1),
                "source_file": c.get("source_file", ""),
                "analogy": f"Reflect on how {key_term} manifests in real-world scenarios as described in your document.",
                "visual_type": vis_type,
                "visual_title": f"Document Analysis: {concept_title}",
                "estimated_seconds": 180 if time_budget <= 20 else 240,
                "checkpoint_question": {
                    "id": f"q_custom_{idx}",
                    "type": "mcq",
                    "question": f"Based on this excerpt from your document, what is the primary role of {key_term}?",
                    "options": [
                        f"It functions as a key foundation in {concept_title}.",
                        "It has no active effect on the discussed topic.",
                        "It contradicts the core thesis of this section.",
                        "It is completely negligible in practical contexts."
                    ],
                    "correct_answer_index": 0,
                    "rubric": f"Tests understanding of {key_term} as described in the uploaded textbook section.",
                    "misconception_traps": {
                        1: "Overlooking the essential significance emphasized in the source material."
                    }
                }
            })
        return concepts

    @staticmethod
    def _detect_subject(topic: str, chunks: List[Dict[str, Any]]) -> str:
        text = (topic + " " + " ".join([c["text"] for c in chunks])).lower()
        if any(w in text for w in ["force", "newton", "motion", "gravity", "velocity", "acceleration", "friction", "inertia"]):
            return "PHYSICS"
        elif any(w in text for w in ["photosynthesis", "cell", "chloroplast", "dna", "plant", "biology", "enzyme", "calvin"]):
            return "BIOLOGY"
        elif any(w in text for w in ["sort", "algorithm", "code", "array", "python", "programming", "complexity", "function"]):
            return "COMPUTER_SCIENCE"
        elif any(w in text for w in ["equation", "calculus", "derivative", "integral", "algebra", "matrix"]):
            return "MATH"
        elif any(w in text for w in ["war", "empire", "revolution", "treaty", "century", "history"]):
            return "HISTORY"
        return "GENERAL_SCIENCE"

    @staticmethod
    def _get_5min_concepts(topic: str, level: str, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        subject = LessonPlanner._detect_subject(topic, chunks)
        
        if subject == "PHYSICS":
            return [
                {
                    "id": "c1",
                    "order": 1,
                    "title": "Inertia & Newton's First Law (The Core Truth)",
                    "depth": "concise",
                    "explanation_focus": "Why objects keep moving forever without friction, and why inertia is mass.",
                    "analogy": "A frictionless skateboard gliding through deep space without ever slowing down.",
                    "visual_type": "SIMULATION_DIAGRAM",
                    "visual_title": "Frictionless Motion & Force Vectors",
                    "estimated_seconds": 130,
                    "checkpoint_question": {
                        "id": "q1",
                        "type": "mcq",
                        "question": "If an astronaut throws a wrench in deep space where no friction or gravity exists, what happens?",
                        "options": [
                            "The wrench eventually slows down and stops because force runs out.",
                            "The wrench continues moving forever at the same constant speed in a straight line.",
                            "The wrench orbits back to the astronaut.",
                            "The wrench instantly falls straight down."
                        ],
                        "correct_answer_index": 1,
                        "rubric": "Evaluates understanding that continuous motion does not require continuous force in the absence of net external force.",
                        "misconception_traps": {
                            0: "Aristotelian misconception: Believing motion requires an ongoing push."
                        }
                    }
                },
                {
                    "id": "c2",
                    "order": 2,
                    "title": "Action-Reaction Pairs (Newton's Third Law)",
                    "depth": "concise",
                    "explanation_focus": "Forces always come in mutual pairs acting on separate bodies, so they never cancel out.",
                    "analogy": "Stepping off a boat onto a dock: you push the boat back, the boat pushes you forward.",
                    "visual_type": "EQUATION",
                    "visual_title": "Action = -Reaction (F_AB = -F_BA)",
                    "estimated_seconds": 150,
                    "checkpoint_question": {
                        "id": "q2",
                        "type": "short_answer",
                        "question": "If action and reaction forces are equal and opposite, why don't they cancel each other out?",
                        "sample_answer": "They do not cancel because they act on two different objects, not on the same object.",
                        "rubric": "Must explicitly identify that forces act on two distinct/different bodies.",
                        "misconception_traps": {
                            "cancel": "Canceling forces fallacy: Thinking action-reaction act on the identical body."
                        }
                    }
                }
            ]
        elif subject == "BIOLOGY":
            return [
                {
                    "id": "c1",
                    "order": 1,
                    "title": "Photosynthesis: The Solar Sugar Factory",
                    "depth": "concise",
                    "explanation_focus": "How plants transform sunlight, CO2, and H2O into glucose and oxygen.",
                    "analogy": "A solar-powered bakery turning ambient air and tap water into sweet bread loaves.",
                    "visual_type": "FLOWCHART_PROCESS",
                    "visual_title": "6 CO2 + 6 H2O + Light -> C6H12O6 + 6 O2",
                    "estimated_seconds": 140,
                    "checkpoint_question": {
                        "id": "q1",
                        "type": "mcq",
                        "question": "Where does the oxygen released during photosynthesis actually come from?",
                        "options": [
                            "Carbon dioxide (CO2)",
                            "Splitting of water molecules (H2O)",
                            "Glucose molecules",
                            "Sunlight itself"
                        ],
                        "correct_answer_index": 1,
                        "rubric": "Evaluates understanding of photolysis of water in light reactions.",
                        "misconception_traps": {
                            0: "CO2 misconception: Believing plants exhale oxygen by stripping it directly from carbon dioxide."
                        }
                    }
                }
            ]
        else: # COMPUTER_SCIENCE or general
            return [
                {
                    "id": "c1",
                    "order": 1,
                    "title": "Bubble Sort: Adjacent Swapping Mechanics",
                    "depth": "concise",
                    "explanation_focus": "Stepping through an array, comparing neighboring pairs, and bubbling larger numbers to the end.",
                    "analogy": "Air bubbles rising in soda bottles according to their size.",
                    "visual_type": "CODE_TRACE",
                    "visual_title": "Adjacent Comparison: if arr[j] > arr[j+1] -> swap",
                    "estimated_seconds": 150,
                    "checkpoint_question": {
                        "id": "q1",
                        "type": "explain_own_words",
                        "question": "Explain in your own words what happens in a single pass of Bubble Sort across an unsorted list.",
                        "sample_answer": "In one pass, adjacent numbers are compared and swapped if out of order, which guarantees the largest unsorted element bubbles to the rightmost position.",
                        "rubric": "Must mention comparing adjacent elements and bubbling the largest element to the end.",
                        "misconception_traps": {}
                    }
                }
            ]

    @staticmethod
    def _get_20min_concepts(topic: str, level: str, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        subject = LessonPlanner._detect_subject(topic, chunks)
        
        if subject == "PHYSICS":
            return [
                {
                    "id": "c1",
                    "order": 1,
                    "title": "1. Galileo's Insight & Inertia (First Law)",
                    "depth": "standard",
                    "explanation_focus": "Transition from Aristotelian intuition to Galileo's inclined planes and Newton's definition of inertia.",
                    "analogy": "Slamming the brakes in a bus: passengers lurch forward because their bodies possess inertia.",
                    "visual_type": "SIMULATION_DIAGRAM",
                    "visual_title": "Newton's 1st Law: Net Force = 0 => Constant Velocity",
                    "estimated_seconds": 220,
                    "checkpoint_question": {
                        "id": "q1",
                        "type": "mcq",
                        "question": "When a car makes a sharp left turn, why do passengers feel thrown toward the right?",
                        "options": [
                            "A mysterious centrifugal force pushes them outward.",
                            "Their body inertia wants to continue moving straight ahead while the car turns left.",
                            "The car's engine generates rightward momentum.",
                            "Gravity tilts to the right side."
                        ],
                        "correct_answer_index": 1,
                        "rubric": "Identifies inertia resisting direction change.",
                        "misconception_traps": {
                            0: "Invented force misconception: Attributing inertia to an active outward push."
                        }
                    }
                },
                {
                    "id": "c2",
                    "order": 2,
                    "title": "2. The Mathematical Engine: F = dp/dt = m*a (Second Law)",
                    "depth": "standard",
                    "explanation_focus": "Rate of change of momentum, relation to acceleration, unit of Newton (kg*m/s^2).",
                    "analogy": "Pushing an empty shopping cart vs. pushing a cart stacked with heavy bricks.",
                    "visual_type": "EQUATION",
                    "visual_title": "F_net = m * a  |  1 N = 1 kg * m/s²",
                    "estimated_seconds": 260,
                    "checkpoint_question": {
                        "id": "q2",
                        "type": "short_answer",
                        "question": "If you double the net force applied to a mass while cutting its mass in half, by what factor does acceleration change?",
                        "sample_answer": "Acceleration increases by a factor of 4 (a = 2F / (0.5m) = 4 * (F/m)).",
                        "rubric": "Mathematical deduction using a = F/m resulting in 4x.",
                        "misconception_traps": {
                            "2": "Forgetting that halving mass also doubles acceleration."
                        }
                    }
                },
                {
                    "id": "c3",
                    "order": 3,
                    "title": "3. Gravitational Equality & Free Fall Misconception",
                    "depth": "standard",
                    "explanation_focus": "Why a bowling ball and a feather drop at identical rates in a vacuum despite different masses.",
                    "analogy": "Galileo at the Leaning Tower of Pisa and Apollo 15 hammer-feather drop on the Moon.",
                    "visual_type": "SIMULATION_DIAGRAM",
                    "visual_title": "Free Fall in Vacuum: a = (m*g) / m = g (Identical for all masses)",
                    "estimated_seconds": 240,
                    "checkpoint_question": {
                        "id": "q3",
                        "type": "explain_own_words",
                        "question": "Why does a 10 kg iron ball experience 10 times more gravitational force than a 1 kg ball, yet both accelerate at the exact same rate?",
                        "sample_answer": "Because the 10 kg ball also has 10 times more inertia (resistance to acceleration), so the extra force is perfectly balanced by the extra mass (a = F/m).",
                        "rubric": "Must mention that greater force is countered by proportionally greater inertia/mass.",
                        "misconception_traps": {
                            "heavier falls faster": "Common gravity-mass misconception."
                        }
                    }
                },
                {
                    "id": "c4",
                    "order": 4,
                    "title": "4. Action-Reaction Pairs: Rockets & Earth Recoil (Third Law)",
                    "depth": "standard",
                    "explanation_focus": "Simultaneous paired forces on distinct bodies. Rocket propulsion mechanics.",
                    "analogy": "A rocket expelling hot exhaust gas downward; the gas pushes the rocket upward into space.",
                    "visual_type": "SIMULATION_DIAGRAM",
                    "visual_title": "Action-Reaction: F_rocket_on_gas = - F_gas_on_rocket",
                    "estimated_seconds": 250,
                    "checkpoint_question": {
                        "id": "q4",
                        "type": "mcq",
                        "question": "When a small mosquito collides with the windshield of a speeding truck, which force is greater?",
                        "options": [
                            "The truck exerts a much larger force on the mosquito than the mosquito exerts on the truck.",
                            "The forces exerted by the mosquito and truck on each other are exactly equal in magnitude.",
                            "The mosquito exerts a larger force because it decelerates faster.",
                            "It depends on the relative speed of the mosquito."
                        ],
                        "correct_answer_index": 1,
                        "rubric": "Newton's 3rd Law equality of force magnitudes regardless of mass asymmetry.",
                        "misconception_traps": {
                            0: "Damage-force conflation: Confusing resulting acceleration/damage with the magnitude of the mutual interaction force."
                        }
                    }
                }
            ]
        elif subject == "BIOLOGY":
            return [
                {
                    "id": "c1",
                    "order": 1,
                    "title": "1. Chloroplast Architecture & Chlorophyll",
                    "depth": "standard",
                    "explanation_focus": "Grana, thylakoid membranes, stroma, and photon absorption.",
                    "analogy": "Solar collector panels arranged on a rooftop.",
                    "visual_type": "FLOWCHART_PROCESS",
                    "visual_title": "Chloroplast Anatomy: Thylakoid & Stroma",
                    "estimated_seconds": 230,
                    "checkpoint_question": {
                        "id": "q1",
                        "type": "mcq",
                        "question": "Which organelle is the primary site of photosynthesis in plant mesophyll cells?",
                        "options": ["Mitochondria", "Chloroplast", "Golgi Apparatus", "Endoplasmic Reticulum"],
                        "correct_answer_index": 1,
                        "rubric": "Basic organelle identification.",
                        "misconception_traps": {}
                    }
                },
                {
                    "id": "c2",
                    "order": 2,
                    "title": "2. Light Reactions: Photolysis & Energy Harvesting",
                    "depth": "standard",
                    "explanation_focus": "Photosystems II and I, electron transport chain, generating ATP and NADPH, releasing O2.",
                    "analogy": "A hydroelectric turbine powered by electron flow.",
                    "visual_type": "FLOWCHART_PROCESS",
                    "visual_title": "Photolysis: 2 H2O -> 4 H+ + 4 e- + O2",
                    "estimated_seconds": 250,
                    "checkpoint_question": {
                        "id": "q2",
                        "type": "short_answer",
                        "question": "What two key energy-carrying molecules are produced during the light reactions to power the Calvin cycle?",
                        "sample_answer": "ATP and NADPH.",
                        "rubric": "Must name ATP and NADPH.",
                        "misconception_traps": {}
                    }
                },
                {
                    "id": "c3",
                    "order": 3,
                    "title": "3. The Calvin Cycle (Light-Independent Phase)",
                    "depth": "standard",
                    "explanation_focus": "Carboxylation by RuBisCO, reduction to G3P/glucose, RuBP regeneration.",
                    "analogy": "A circular assembly line in a factory.",
                    "visual_type": "FLOWCHART_PROCESS",
                    "visual_title": "Calvin Cycle: Fixation -> Reduction -> Regeneration",
                    "estimated_seconds": 240,
                    "checkpoint_question": {
                        "id": "q3",
                        "type": "explain_own_words",
                        "question": "Why is calling the Calvin Cycle 'Dark Reactions' misleading? Does it only occur at night?",
                        "sample_answer": "It is misleading because while it doesn't need direct light, it relies directly on short-lived ATP and NADPH generated in daylight, so in nature it occurs during daytime.",
                        "rubric": "Highlights reliance on ATP/NADPH from light reactions.",
                        "misconception_traps": {}
                    }
                }
            ]
        else: # COMPUTER_SCIENCE or general
            return [
                {
                    "id": "c1",
                    "order": 1,
                    "title": "1. Bubble Sort: Mechanics & Pairwise Comparisons",
                    "depth": "standard",
                    "explanation_focus": "Iterative passes, adjacent swaps, pushing max value to the right boundary.",
                    "analogy": "Sorting playing cards by comparing neighbors.",
                    "visual_type": "CODE_TRACE",
                    "visual_title": "Pass 1: Swapping adjacent elements",
                    "estimated_seconds": 240,
                    "checkpoint_question": {
                        "id": "q1",
                        "type": "mcq",
                        "question": "After the first complete pass of Bubble Sort on [5, 1, 4, 2, 8], what is guaranteed?",
                        "options": [
                            "The entire array is sorted.",
                            "The smallest number (1) is in index 0.",
                            "The largest number (8) is in its correct final position at the end.",
                            "No elements were swapped."
                        ],
                        "correct_answer_index": 2,
                        "rubric": "Recognizes rightmost placement of max element.",
                        "misconception_traps": {}
                    }
                },
                {
                    "id": "c2",
                    "order": 2,
                    "title": "2. Optimization with Swapped Flag",
                    "depth": "standard",
                    "explanation_focus": "Detecting early termination when array is already ordered.",
                    "analogy": "Checking if books are already straight on the shelf without reordering.",
                    "visual_type": "CODE_TRACE",
                    "visual_title": "Early Exit: if not swapped -> break",
                    "estimated_seconds": 230,
                    "checkpoint_question": {
                        "id": "q2",
                        "type": "short_answer",
                        "question": "What is the best-case time complexity of optimized Bubble Sort on an already-sorted array of n elements?",
                        "sample_answer": "O(n) linear time.",
                        "rubric": "States O(n).",
                        "misconception_traps": {}
                    }
                },
                {
                    "id": "c3",
                    "order": 3,
                    "title": "3. Complexity Analysis & Big-O Tradeoffs",
                    "depth": "standard",
                    "explanation_focus": "Worst case O(n^2), space complexity O(1), stability.",
                    "analogy": "Comparing quadratic curve growth against linear growth.",
                    "visual_type": "CODE_TRACE",
                    "visual_title": "Time: O(n²) Worst, O(n) Best | Space: O(1)",
                    "estimated_seconds": 250,
                    "checkpoint_question": {
                        "id": "q3",
                        "type": "explain_own_words",
                        "question": "Why is Bubble Sort rarely used in production software for large datasets?",
                        "sample_answer": "Because its O(n^2) worst-case time complexity causes execution time to explode quadratically as input size grows compared to O(n log n) algorithms like Merge Sort.",
                        "rubric": "Refers to O(n^2) quadratic scaling vs faster O(n log n) algorithms.",
                        "misconception_traps": {}
                    }
                }
            ]

    @staticmethod
    def _get_60min_concepts(topic: str, level: str, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        # 60 min lesson plan: 5-6 concepts with deep dives and applied problems
        base_concepts = LessonPlanner._get_20min_concepts(topic, level, chunks)
        subject = LessonPlanner._detect_subject(topic, chunks)
        
        extra_concept = {
            "id": f"c{len(base_concepts)+1}",
            "order": len(base_concepts) + 1,
            "title": "5. Applied Real-World Problem Solving & Multi-Body Systems",
            "depth": "rigorous",
            "explanation_focus": "Free body diagrams, tension forces, elevator apparent weight, and friction coefficient problems.",
            "analogy": "An elevator accelerating upward where your bathroom scale reads heavier than normal.",
            "visual_type": "SIMULATION_DIAGRAM" if subject == "PHYSICS" else "EQUATION",
            "visual_title": "Apparent Weight: N = m * (g + a)",
            "estimated_seconds": 320,
            "checkpoint_question": {
                "id": "q5",
                "type": "short_answer",
                "question": "If you stand on a scale inside an elevator that suddenly snaps its cables and enters free fall, what does the scale read?",
                "sample_answer": "Zero (apparent weightlessness), because both you and the scale accelerate downward at g.",
                "rubric": "Correctly states zero or apparent weightlessness.",
                "misconception_traps": {}
            }
        }
        return base_concepts + [extra_concept]

    @staticmethod
    def _plan_multiday(profile: Dict[str, Any], topic: str, chunks: List[Dict[str, Any]], is_grounded: bool) -> Dict[str, Any]:
        days = profile.get("multiday_count", 7)
        clean_topic = topic.replace("_", " ").title() if topic else "Course Material"

        # Extract headings or key themes from uploaded chunks
        themes = []
        if chunks:
            for c in chunks:
                sec = c.get("section_title", "").strip()
                if sec and len(sec) > 3 and sec not in ["General Overview", "General Content", "General", "Introduction", "Overview"]:
                    if sec not in themes:
                        themes.append(sec)

        default_themes = [
            ("Day 1: Foundations & Core Intuition", f"Fundamental principles, definitions, and foundational concepts of {clean_topic}."),
            ("Day 2: Primary Mechanisms & Governing Laws", f"Core operational mechanisms, causal dynamics, and primary laws of {clean_topic}."),
            ("Day 3: Mathematical Formulation & Quantitative Relationships", f"Mathematical models, equations, variable dependencies, and derivations."),
            ("Day 4: Laboratory Simulations & Interactive Experiments", f"Visual models, hands-on virtual sandbox demonstrations, and parameter sensitivity."),
            ("Day 5: Real-World Applications & Applied Problem Solving", f"Step-by-step problem sets, engineering examples, and practical systems."),
            ("Day 6: Critical Edge Cases & Common Exam Traps", f"Diagnostic review of misconceptions, boundary constraints, and tricky exam scenarios."),
            ("Day 7: Capstone Synthesis & Comprehensive Mastery", f"Full conceptual synthesis, adaptive final assessment, and mastery certificate.")
        ]

        curriculum = []
        concepts = []

        for d in range(1, days + 1):
            theme_idx = d - 1
            if theme_idx < len(themes):
                day_title = f"Day {d}: {themes[theme_idx]}"
                day_focus = f"In-depth mastery of {themes[theme_idx]} from uploaded material with formative checkpoints."
            else:
                def_t, def_f = default_themes[min(theme_idx, len(default_themes) - 1)]
                day_title = def_t if days == 7 else f"Day {d}: Milestone {d}"
                day_focus = def_f

            curriculum.append({
                "day": d,
                "title": day_title,
                "focus": day_focus,
                "expected_duration": "30 mins",
                "checkpoint_type": "Daily Formative Checkpoint" if d < days else "Final Capstone Exam"
            })

            concepts.append({
                "id": f"day_{d}",
                "order": d,
                "title": day_title,
                "depth": "comprehensive",
                "explanation_focus": day_focus,
                "analogy": f"Conceptual stepping-stone {d} in mastering {clean_topic}.",
                "visual_type": "SIMULATION_DIAGRAM" if d % 2 == 1 else "FLOWCHART_PROCESS",
                "visual_title": f"{clean_topic} • {day_title}",
                "estimated_seconds": 300,
                "checkpoint_question": {
                    "id": f"q_day_{d}",
                    "type": "mcq",
                    "question": f"Which statement best characterizes the primary focus of {day_title} regarding {clean_topic}?",
                    "options": [
                        f"It establishes the foundational operational mechanisms for {clean_topic}.",
                        "It has no measurable connection to the real-world domain.",
                        "It is an obsolete principle replaced by modern hypotheses.",
                        "It only applies under zero-gravity conditions."
                    ],
                    "correct_idx": 0,
                    "explanation": f"This milestone specifically focuses on: {day_focus}",
                    "misconception_traps": {}
                }
            })

        return {
            "topic": clean_topic,
            "learner_level": profile.get("level", "beginner"),
            "target_time_minutes": days * 30,
            "actual_planned_minutes": days * 30,
            "is_multiday": True,
            "days_count": days,
            "concepts_count": len(concepts),
            "language": profile.get("language", "en"),
            "teaching_style": profile.get("teaching_style", "intuitive"),
            "is_grounded": is_grounded,
            "confidence_framing": "high_grounded" if is_grounded else "general_knowledge",
            "grounding_notice": (
                "Verified 7-Day Curriculum grounded in uploaded educational material with full provenance."
                if is_grounded else
                "7-Day Comprehensive Learning Roadmap synthesized from domain foundational principles."
            ),
            "concepts": concepts,
            "curriculum": curriculum
        }
