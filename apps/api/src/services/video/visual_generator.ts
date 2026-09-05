import {
  SubjectCategory,
  SceneType,
  ISceneVisual,
} from '@ai-teacher/types';

export class SubjectAwareVisualGenerator {
  /**
   * Determine subject category from lesson title and topic
   */
  public static detectSubject(topic: string, description: string = ''): SubjectCategory {
    const combined = `${topic} ${description}`.toLowerCase();
    if (combined.includes('math') || combined.includes('calculus') || combined.includes('algebra') || combined.includes('geometry') || combined.includes('derivative') || combined.includes('integral')) {
      return 'math';
    }
    if (combined.includes('physics') || combined.includes('newton') || combined.includes('motion') || combined.includes('force') || combined.includes('energy') || combined.includes('gravity') || combined.includes('velocity')) {
      return 'physics';
    }
    if (combined.includes('bio') || combined.includes('cell') || combined.includes('dna') || combined.includes('organ') || combined.includes('mitosis') || combined.includes('photosynthesis')) {
      return 'biology';
    }
    if (combined.includes('history') || combined.includes('war') || combined.includes('empire') || combined.includes('revolution') || combined.includes('dynasty') || combined.includes('treaty')) {
      return 'history';
    }
    if (combined.includes('code') || combined.includes('program') || combined.includes('python') || combined.includes('javascript') || combined.includes('algorithm') || combined.includes('data structure') || combined.includes('react')) {
      return 'programming';
    }
    return 'physics'; // Default to foundational physics
  }

  /**
   * Generate educational, domain-specific visual content for a scene
   */
  public static generateVisualForScene(
    sceneType: SceneType,
    subject: SubjectCategory,
    topic: string,
    conceptKey: string
  ): ISceneVisual {
    switch (subject) {
      case 'math':
        return this.generateMathVisual(sceneType, topic, conceptKey);
      case 'physics':
        return this.generatePhysicsVisual(sceneType, topic, conceptKey);
      case 'biology':
        return this.generateBiologyVisual(sceneType, topic, conceptKey);
      case 'history':
        return this.generateHistoryVisual(sceneType, topic, conceptKey);
      case 'programming':
        return this.generateProgrammingVisual(sceneType, topic, conceptKey);
      default:
        return this.generatePhysicsVisual(sceneType, topic, conceptKey);
    }
  }

  // 1. MATHEMATICS: Equations + Dynamic Cartesian coordinate plots
  private static generateMathVisual(sceneType: SceneType, topic: string, conceptKey: string): ISceneVisual {
    const graphPoints = [
      { x: -5, y: 25 }, { x: -4, y: 16 }, { x: -3, y: 9 }, { x: -2, y: 4 }, { x: -1, y: 1 },
      { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 4 }, { x: 3, y: 9 }, { x: 4, y: 16 }, { x: 5, y: 25 }
    ];

    const svg = `
      <svg viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <defs>
          <linearGradient id="mathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#818cf8"/>
          </linearGradient>
        </defs>
        <rect width="600" height="360" fill="#090d16" rx="16"/>
        <!-- Coordinate Grid -->
        <g stroke="#1e293b" stroke-width="1">
          <line x1="50" y1="50" x2="550" y2="50"/>
          <line x1="50" y1="120" x2="550" y2="120"/>
          <line x1="50" y1="190" x2="550" y2="190"/>
          <line x1="50" y1="260" x2="550" y2="260"/>
          <line x1="50" y1="330" x2="550" y2="330"/>
          <line x1="100" y1="30" x2="100" y2="330"/>
          <line x1="200" y1="30" x2="200" y2="330"/>
          <line x1="300" y1="30" x2="300" y2="330"/>
          <line x1="400" y1="30" x2="400" y2="330"/>
          <line x1="500" y1="30" x2="500" y2="330"/>
        </g>
        <!-- Axes -->
        <line x1="50" y1="190" x2="550" y2="190" stroke="#64748b" stroke-width="2.5"/>
        <line x1="300" y1="30" x2="300" y2="330" stroke="#64748b" stroke-width="2.5"/>
        <text x="535" y="180" fill="#94a3b8" font-size="13" font-family="sans-serif">x</text>
        <text x="312" y="45" fill="#94a3b8" font-size="13" font-family="sans-serif">f(x)</text>
        <!-- Curve f(x) = x^2 -->
        <path d="M 120,40 Q 300,340 480,40" fill="none" stroke="url(#mathGrad)" stroke-width="4.5"/>
        <!-- Highlight Point -->
        <circle cx="390" cy="115" r="7" fill="#38bdf8" stroke="#ffffff" stroke-width="2"/>
        <text x="405" y="115" fill="#e2e8f0" font-size="12" font-family="monospace">P(x, x²)</text>
      </svg>
    `;

    return {
      type: sceneType,
      subject: 'math',
      title: `${topic}: Quadratic & Differential Curvature`,
      description: 'Cartesian coordinate function visualization with tangent and rate-of-change markers.',
      svgData: svg.trim(),
      latexFormula: 'f(x) = x^2 \\implies \\frac{df}{dx} = 2x',
      graphPoints,
    };
  }

  // 2. PHYSICS: Force Vectors + Inertial Motion Simulation
  private static generatePhysicsVisual(sceneType: SceneType, topic: string, conceptKey: string): ISceneVisual {
    const svg = `
      <svg viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <defs>
          <linearGradient id="physGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#3b82f6"/>
            <stop offset="100%" stop-color="#10b981"/>
          </linearGradient>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8"/>
          </marker>
          <marker id="forceArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e"/>
          </marker>
        </defs>
        <rect width="600" height="360" fill="#080c14" rx="16"/>
        <!-- Frictionless Track -->
        <line x1="40" y1="260" x2="560" y2="260" stroke="#334155" stroke-width="3"/>
        <line x1="40" y1="265" x2="560" y2="265" stroke="#1e293b" stroke-dasharray="6,6" stroke-width="2"/>
        <text x="50" y="290" fill="#64748b" font-size="12" font-family="sans-serif">Frictionless Surface (μ = 0)</text>
        
        <!-- Moving Object (Block) -->
        <rect x="230" y="180" width="140" height="80" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
        <text x="275" y="225" fill="#f8fafc" font-size="16" font-weight="bold" font-family="sans-serif">m = 5 kg</text>
        
        <!-- Vectors -->
        <!-- Normal Force Fn -->
        <line x1="300" y1="180" x2="300" y2="100" stroke="#38bdf8" stroke-width="3" marker-end="url(#arrow)"/>
        <text x="312" y="115" fill="#38bdf8" font-size="13" font-weight="bold">F_N = 49 N</text>
        
        <!-- Gravity Fg -->
        <line x1="300" y1="260" x2="300" y2="330" stroke="#38bdf8" stroke-width="3" marker-end="url(#arrow)"/>
        <text x="312" y="325" fill="#38bdf8" font-size="13" font-weight="bold">F_g = mg = 49 N</text>
        
        <!-- Velocity Vector v -->
        <line x1="370" y1="220" x2="490" y2="220" stroke="#10b981" stroke-width="4" marker-end="url(#arrow)"/>
        <text x="410" y="205" fill="#10b981" font-size="13" font-weight="bold">v = 15 m/s (Const)</text>
        
        <!-- Net Force callout -->
        <rect x="420" y="50" width="150" height="55" rx="8" fill="#0f172a" stroke="#475569" stroke-width="1.5"/>
        <text x="435" y="73" fill="#e2e8f0" font-size="12" font-weight="bold">Net Force ΣF = 0</text>
        <text x="435" y="93" fill="#94a3b8" font-size="11">Acceleration a = 0 m/s²</text>
      </svg>
    `;

    return {
      type: sceneType,
      subject: 'physics',
      title: `${topic}: Free-Body Force Diagram`,
      description: 'Balanced vertical force vectors demonstrating perpetual velocity with zero net external force.',
      svgData: svg.trim(),
      latexFormula: '\\sum \\vec{F} = m\\vec{a} = 0 \\implies \\vec{v} = \\text{constant}',
      diagramElements: [
        { id: 'f_normal', label: 'Normal Force (Fn)', shape: 'arrow', x: 300, y: 100 },
        { id: 'f_gravity', label: 'Gravity Force (Fg)', shape: 'arrow', x: 300, y: 330 },
        { id: 'velocity', label: 'Constant Velocity Vector', shape: 'arrow', x: 490, y: 220 },
      ],
    };
  }

  // 3. BIOLOGY: Cellular Anatomy & Labeled Structures
  private static generateBiologyVisual(sceneType: SceneType, topic: string, conceptKey: string): ISceneVisual {
    const svg = `
      <svg viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="600" height="360" fill="#081014" rx="16"/>
        <!-- Outer Cell Membrane -->
        <ellipse cx="300" cy="180" rx="240" ry="140" fill="#0f291e" stroke="#10b981" stroke-width="4"/>
        
        <!-- Cytoplasm -->
        <text x="80" y="80" fill="#6ee7b7" font-size="13" font-weight="bold">Cytoplasm</text>
        
        <!-- Nucleus -->
        <circle cx="250" cy="180" r="65" fill="#1e1b4b" stroke="#818cf8" stroke-width="3"/>
        <circle cx="250" cy="180" r="28" fill="#4338ca" stroke="#c7d2fe" stroke-width="2"/>
        <text x="220" y="185" fill="#ffffff" font-size="11" font-weight="bold">Nucleolus</text>
        
        <!-- Mitochondria -->
        <ellipse cx="430" cy="140" rx="45" ry="25" fill="#831843" stroke="#f43f5e" stroke-width="2" transform="rotate(25 430 140)"/>
        <path d="M 395,135 Q 430,120 465,145" fill="none" stroke="#fda4af" stroke-width="2"/>
        <text x="400" y="190" fill="#fda4af" font-size="12" font-weight="bold">Mitochondrion</text>
        <text x="400" y="205" fill="#94a3b8" font-size="10">ATP Synthesis</text>
        
        <!-- Ribosomes -->
        <circle cx="160" cy="140" r="4" fill="#facc15"/>
        <circle cx="180" cy="220" r="4" fill="#facc15"/>
        <circle cx="360" cy="240" r="4" fill="#facc15"/>
        <circle cx="380" cy="100" r="4" fill="#facc15"/>
        <text x="140" y="250" fill="#fef08a" font-size="11">Ribosomes (Protein synthesis)</text>
      </svg>
    `;

    return {
      type: sceneType,
      subject: 'biology',
      title: `${topic}: Cellular Anatomy & Organelles`,
      description: 'High-clarity labeled cross-section of eukaryotic cell structures and energetic synthesis.',
      svgData: svg.trim(),
      labeledStructures: [
        { label: 'Nucleus & DNA', x: 250, y: 180, detail: 'Houses genetic code and coordinates protein synthesis' },
        { label: 'Mitochondria', x: 430, y: 140, detail: 'Powerhouse organelle generating cellular ATP via respiration' },
        { label: 'Cell Membrane', x: 500, y: 180, detail: 'Semi-permeable phospholipid bilayer governing homeostasis' },
      ],
    };
  }

  // 4. HISTORY: Interactive Chronological Timeline
  private static generateHistoryVisual(sceneType: SceneType, topic: string, conceptKey: string): ISceneVisual {
    const timelineEvents = [
      { year: '1687', title: 'Principia Published', description: 'Isaac Newton formalizes laws of motion and universal gravitation.' },
      { year: '1789', title: 'Industrial Revolution Accelerates', description: 'Application of Newtonian mechanics transforms automated manufacturing.' },
      { year: '1905', title: 'Annus Mirabilis (Einstein)', description: 'Special relativity unifies Newtonian spacetime with electrodynamics.' },
      { year: '1969', title: 'Apollo 11 Lunar Landing', description: 'Newtonian orbital mechanics lands humans on the Moon.' },
    ];

    const svg = `
      <svg viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="600" height="360" fill="#120c0a" rx="16"/>
        <text x="40" y="45" fill="#f59e0b" font-size="16" font-weight="bold">Historical Trajectory & Milestones</text>
        
        <!-- Timeline Bar -->
        <line x1="60" y1="180" x2="540" y2="180" stroke="#78350f" stroke-width="4"/>
        
        <!-- Nodes -->
        <circle cx="100" cy="180" r="10" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
        <text x="80" y="150" fill="#fde68a" font-size="13" font-weight="bold">1687</text>
        <text x="60" y="215" fill="#e2e8f0" font-size="11">Principia</text>
        
        <circle cx="230" cy="180" r="10" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
        <text x="210" y="150" fill="#fde68a" font-size="13" font-weight="bold">1789</text>
        <text x="180" y="215" fill="#e2e8f0" font-size="11">Industry</text>
        
        <circle cx="370" cy="180" r="10" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
        <text x="350" y="150" fill="#fde68a" font-size="13" font-weight="bold">1905</text>
        <text x="335" y="215" fill="#e2e8f0" font-size="11">Relativity</text>
        
        <circle cx="500" cy="180" r="10" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
        <text x="480" y="150" fill="#6ee7b7" font-size="13" font-weight="bold">1969</text>
        <text x="475" y="215" fill="#e2e8f0" font-size="11">Moon Landing</text>
      </svg>
    `;

    return {
      type: sceneType,
      subject: 'history',
      title: `${topic}: Historical Timeline & Evolution`,
      description: 'Milestone chronology showing historical breakthroughs and their global technological impact.',
      svgData: svg.trim(),
      timelineEvents,
    };
  }

  // 5. PROGRAMMING: Executable Code Syntax + Output Flow
  private static generateProgrammingVisual(sceneType: SceneType, topic: string, conceptKey: string): ISceneVisual {
    const codeSnippet = `
class InertialBody:
    def __init__(self, mass_kg: float, velocity_mps: float):
        self.mass = mass_kg
        self.velocity = velocity_mps
        
    def step_simulation(self, net_force_newtons: float, dt_seconds: float):
        # Newton's 2nd Law: F = m * a -> a = F / m
        acceleration = net_force_newtons / self.mass
        self.velocity += acceleration * dt_seconds
        return self.velocity

puck = InertialBody(mass_kg=5.0, velocity_mps=15.0)
print(f"Initial Velocity: {puck.velocity} m/s")
# In frictionless space (F_net = 0):
puck.step_simulation(net_force_newtons=0.0, dt_seconds=10.0)
print(f"Velocity after 10s: {puck.velocity} m/s (Inertia Preserved)")
    `.trim();

    const executionOutput = `
>>> Initial Velocity: 15.0 m/s
>>> Simulating 10s with net_force = 0.0 N...
>>> Velocity after 10s: 15.0 m/s (Inertia Preserved)
>>> Execution finished with status code 0.
    `.trim();

    return {
      type: sceneType,
      subject: 'programming',
      title: `${topic}: Algorithmic Implementation`,
      description: 'Object-oriented simulation demonstrating state conservation and execution flow.',
      codeSnippet,
      codeLanguage: 'python',
      executionOutput,
    };
  }
}
