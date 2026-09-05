"""
VISUAL PLANNER SERVICE
Generates validated, structured JSON visual specifications for the Live Classroom.
Ensures the AI controls visuals through safe declarative specs rather than arbitrary JS code.
"""

from typing import Dict, Any, List, Optional
import re
import logging

logger = logging.getLogger("visual_planner")

class VisualPlanner:
    """
    Produces domain-aware, structured visual plans with timeline actions
    synchronized to spoken teacher explanations.
    """

    @staticmethod
    def plan_visual(
        concept_title: str,
        domain: str = "general",
        level: str = "beginner",
        context_text: str = "",
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Creates a structured visual specification for the current concept.
        """
        title_lower = (concept_title + " " + context_text[:200]).lower()

        # ---------------------------------------------------------------------
        # 1. OPERATING SYSTEMS: Process vs Program or Process States
        # ---------------------------------------------------------------------
        if "process state" in title_lower or "lifecycle" in title_lower or "pcb" in title_lower:
            return {
                "visualType": "process_animation",
                "title": "Process State Transition & Lifecycle",
                "description": "State transition model showing how operating systems schedule processes from creation to termination.",
                "domain": "os",
                "states": [
                    {"id": "new", "label": "New", "color": "#6366f1", "desc": "Process being created"},
                    {"id": "ready", "label": "Ready", "color": "#06b6d4", "desc": "In RAM waiting for CPU"},
                    {"id": "running", "label": "Running", "color": "#10b981", "desc": "Instructions executing on CPU"},
                    {"id": "waiting", "label": "Waiting (Blocked)", "color": "#f59e0b", "desc": "Waiting for I/O event"},
                    {"id": "terminated", "label": "Terminated", "color": "#f43f5e", "desc": "Finished & resources reclaimed"}
                ],
                "transitions": [
                    {"from": "new", "to": "ready", "label": "Admitted to RAM"},
                    {"from": "ready", "to": "running", "label": "Scheduler Dispatch"},
                    {"from": "running", "to": "ready", "label": "Timer Interrupt (Preempt)"},
                    {"from": "running", "to": "waiting", "label": "I/O or Event Wait"},
                    {"from": "waiting", "to": "ready", "label": "I/O Completion"},
                    {"from": "running", "to": "terminated", "label": "Exit / Complete"}
                ],
                "activeToken": "running",
                "timeline": [
                    {"time": 0, "action": "highlight_state", "target": "new"},
                    {"time": 5, "action": "move_token", "from": "new", "to": "ready"},
                    {"time": 10, "action": "dispatch", "from": "ready", "to": "running"},
                    {"time": 15, "action": "io_wait", "from": "running", "to": "waiting"}
                ]
            }

        if "process" in title_lower and ("program" in title_lower or "difference" in title_lower or "what is" in title_lower):
            return {
                "visualType": "comparison",
                "title": "Program vs Process — Core Architecture",
                "description": "Side-by-side comparison of passive disk binary vs active RAM execution.",
                "domain": "os",
                "left": {
                    "header": "Program (Passive Entity)",
                    "badge": "On Storage (Disk/SSD)",
                    "points": [
                        "Passive file stored on secondary storage (e.g. `chrome.exe`)",
                        "Contains static machine code instructions and static data",
                        "Does not consume CPU cycles or dynamic RAM memory",
                        "Exists indefinitely until deleted by user"
                    ],
                    "icon": "file_code"
                },
                "right": {
                    "header": "Process (Active Entity)",
                    "badge": "In RAM Execution",
                    "points": [
                        "Active program loaded into main memory (RAM)",
                        "Possesses Program Counter (PC), CPU registers & Stack pointer",
                        "Managed dynamically by kernel via Process Control Block (PCB)",
                        "Transitions through New, Ready, Running, Waiting states"
                    ],
                    "icon": "cpu"
                },
                "keyInsight": "A program is a passive recipe; a process is the active cooking in the kitchen with ingredients loaded in RAM!"
            }

        # ---------------------------------------------------------------------
        # 2. NETWORKS / WEB: Client-Server Architecture
        # ---------------------------------------------------------------------
        if "client" in title_lower or "server" in title_lower or "network" in title_lower or "api" in title_lower:
            return {
                "visualType": "architecture",
                "title": "Client-Server Tiered Architecture",
                "description": "Full request-response flow from frontend client through API gateway to persistent database.",
                "domain": "cs",
                "nodes": [
                    {"id": "client", "label": "Client (Browser / Mobile)", "type": "client", "color": "#06b6d4"},
                    {"id": "api", "label": "API Gateway / Node.js Server", "type": "server", "color": "#818cf8"},
                    {"id": "db", "label": "Persistent Database (SQL/NoSQL)", "type": "database", "color": "#10b981"}
                ],
                "connections": [
                    {"from": "client", "to": "api", "label": "HTTP/REST Request", "status": "active"},
                    {"from": "api", "to": "db", "label": "Database Query", "status": "active"},
                    {"from": "db", "to": "api", "label": "Query Result Records", "status": "idle"},
                    {"from": "api", "to": "client", "label": "JSON Response Payload", "status": "idle"}
                ],
                "packetAnimation": True
            }

        # ---------------------------------------------------------------------
        # 3. ALGORITHMS / BINARY SEARCH
        # ---------------------------------------------------------------------
        if "binary search" in title_lower or "sort" in title_lower or "search" in title_lower:
            return {
                "visualType": "code_trace",
                "title": "Binary Search Array Partitioning",
                "description": "Divide and conquer search space halving on sorted monotonic array.",
                "domain": "cs",
                "array": [2, 5, 8, 12, 16, 23, 38, 56, 72, 91],
                "target": 23,
                "low": 0,
                "high": 9,
                "mid": 4,
                "steps": [
                    {"step": 1, "low": 0, "high": 9, "mid": 4, "midVal": 16, "action": "16 < 23 ⟹ search right half", "eliminated": [0, 1, 2, 3, 4]},
                    {"step": 2, "low": 5, "high": 9, "mid": 7, "midVal": 56, "action": "56 > 23 ⟹ search left half", "eliminated": [7, 8, 9]},
                    {"step": 3, "low": 5, "high": 6, "mid": 5, "midVal": 23, "action": "23 == 23 ⟹ Target Found! O(log n)", "eliminated": [6]}
                ]
            }

        # ---------------------------------------------------------------------
        # 4. PHYSICS & NEWTON'S LAWS / ORBIT
        # ---------------------------------------------------------------------
        if "newton" in title_lower or "force" in title_lower or "orbit" in title_lower or "gravity" in title_lower:
            return {
                "visualType": "3d_scene",
                "title": concept_title,
                "description": "Real-time 3D physics mechanics with animated gravitational and velocity vectors.",
                "domain": "physics",
                "modelType": "celestial_orbit" if ("orbit" in title_lower or "gravit" in title_lower) else "mechanics_lab",
                "governingEquation": "ΣF = m·a  ⟺  F_g = G·(M·m)/r²",
                "parameters": [
                    {"name": "Applied Force", "value": "150 N", "color": "#06b6d4"},
                    {"name": "Inertial Mass", "value": "10 kg", "color": "#818cf8"},
                    {"name": "Calculated Acceleration", "value": "15 m/s²", "color": "#10b981"}
                ]
            }

        # ---------------------------------------------------------------------
        # 5. AI / TRANSFORMERS / ATTENTION
        # ---------------------------------------------------------------------
        if "transformer" in title_lower or "attention" in title_lower or "neural" in title_lower or "ai" in domain:
            return {
                "visualType": "3d_scene",
                "title": concept_title,
                "description": "3D Multi-Head Attention hyper-sphere with dynamic Query-Key tensor dot product paths.",
                "domain": "ai",
                "modelType": "attention_core",
                "governingEquation": "Attention(Q, K, V) = softmax(Q·Kᵀ / √d_k) · V",
                "parameters": [
                    {"name": "Attention Heads", "value": "8 Heads", "color": "#38bdf8"},
                    {"name": "Embedding Dimension", "value": "512 Dim", "color": "#818cf8"},
                    {"name": "Scale Factor (√d_k)", "value": "8.0", "color": "#34d399"}
                ]
            }

        # ---------------------------------------------------------------------
        # DEFAULT: Interactive Whiteboard with Step-by-Step Flow
        # ---------------------------------------------------------------------
        return {
            "visualType": "flowchart",
            "title": concept_title,
            "description": f"Structured conceptual breakdown for {concept_title}.",
            "domain": domain,
            "steps": [
                {"number": 1, "title": "Foundational Premise", "detail": f"Initial state and core variables of {concept_title}."},
                {"number": 2, "title": "Dynamic Transformation", "detail": "Inter-layer mechanics and governing state transitions."},
                {"number": 3, "title": "Equilibrium & Output", "detail": "Final converged system behavior and practical application."}
            ],
            "governingEquation": f"System({concept_title}) ⟹ Core Principles",
            "realWorldAnalogy": context_text[:140] if context_text else f"Understanding {concept_title} step by step."
        }

visual_planner = VisualPlanner()
