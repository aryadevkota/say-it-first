# Say It First: System Architecture & Implementation Manual

**Technical Specification for System Developers and Software Engineers**

*System Design & Architecture Manual | Sole Technical Specification*

| Document Version | Architecture Pattern | Target Stack | Latency Target |
| :--- | :--- | :--- | :--- |
| **1.0.0-PROD-SPEC** | Hexagonal / Ports & Adapters | Next.js 14 / TypeScript / Web Audio | p95 < 1400ms |

---

## 1. Architectural Pattern & Module Topology

The system follows a strict **Hexagonal Architecture (Ports and Adapters)** pattern to ensure deterministic state transitions, complete decoupling of the browser Web Audio DSP engine from backend LLM reasoning, and 100% unit-testable mathematical domain logic.

### Module Layout: Core Directory Structure & Module Boundaries

```text
// SYSTEM DIRECTORY STRUCTURE
src/
├── domain/                               # Pure Enterprise Logic (Zero external dependencies)
│   ├── entities/
│   │   ├── AffectVector.ts               # 3D Vector operations, clamps, distance metrics
│   │   ├── ConversationNode.ts           # Timeline node, turn metadata, branching pointers
│   │   └── TwoWayBridge.ts               # Stated intent vs. received impact data structure
│   ├── services/
│   │   ├── AffectDynamicsService.ts      # Differential equations for emotional inertia
│   │   └── TensionEvaluatorService.ts    # Mathematical safety gate computation
│   └── value-objects/
│       ├── ProsodyMetrics.ts             # WPM, RMS volume, Pitch variance
│       └── ScaffoldingLevel.ts           # 0% (Reality), 50% (Hints), 100% (X-Ray)
├── application/                          # Orchestration & Use Cases
│   ├── ports/
│   │   ├── in/
│   │   │   └── ProcessTurnCommand.ts     # Command interface for turn processing
│   │   └── out/
│   │       ├── LLMInferencePort.ts       # Contract for external reasoning engines
│   │       ├── VoiceSynthesisPort.ts     # Contract for speech generation
│   │       └── SessionRepositoryPort.ts  # Contract for state tree persistence
│   └── use-cases/
│       ├── ProcessTurnUseCase.ts         # Coordinates DSP metrics -> LLM -> Vector smoothing
│       ├── BranchConversationUseCase.ts  # Forks DAG on timeline rewind
│       └── GeneratePocketScriptUseCase.ts# Compiles debrief and actionable summary
├── infrastructure/                       # External Frameworks, Network & Drivers
│   ├── adapters/
│   │   ├── llm/
│   │   │   ├── GeminiStructuredAdapter.ts# JSON Mode implementation for Gemini 1.5
│   │   │   └── PromptTemplates.ts        # Versioned system prompt definitions
│   │   └── storage/
│   │       └── InMemorySessionRepo.ts    # Ephemeral thread-safe session map
│   └── web-audio/
│       ├── AudioProcessor.ts             # Web Audio API Context & AnalyserNode bindings
│       └── ProsodyExtractor.ts           # Autocorrelation F0, RMS, and zero-crossing DSP
└── presentation/                         # User Interface & Controllers
    ├── api/
    │   └── routes/conversation.ts        # Next.js Route Handler (POST /api/v1/conversation/turn)
    ├── components/
    │   ├── AffectRadarCanvas.tsx         # 2D Cartesian phase plot (Valence x Arousal)
    │   ├── AvatarSvgRig.tsx              # Parametric Bezier curve morphing avatar
    │   ├── SubtextHud.tsx                # Two-Way Bridge, Thought Bubble, Scaffolding Dial
    │   └── InputDock.tsx                 # Push-to-Talk audio streamer & text input
    └── hooks/
        ├── useWebAudioProsody.ts         # Audio capture & local DSP calculation
        └── useTimelineBranching.ts       # React state interface for DAG timeline
```

---

## 2. Requirements & Quantitative Engineering Constraints

### 2.1 Functional Requirements Matrix

| Requirement ID | Subsystem | Engineering Specification | Verification Standard |
| :--- | :--- | :--- | :--- |
| **FR-01** | Scenario Engine | Load immutable scenario configs (Alex, Jordan, Dr. Reyes) with baseline VAD vector E0 and inertia lambda. | Assert schema validation and initial state load < 10ms. |
| **FR-02** | Dual Input Ingestion | Stream microphone PCM via Web Audio API or ingest UTF-8 text string with zero pipeline bifurcation. | Input latency to API dispatch < 5ms. |
| **FR-03** | Affect Computation | Compute continuous VAD vector E(t+1) in $[-1.0, 1.0]^3$ via first-order exponential smoothing equation. | Assert vector invariants: $|V|, |A|, |D| \le 1.000$. |
| **FR-04** | Two-Way Bridge | Emit discrete strings: `user_intent` (functional need) and `received_as` (pragmatic social decoding). | Assert non-empty string pair on every turn payload. |
| **FR-05** | Scaffolding Dial | Filter client visual state: Level 0 (Text hidden), Level 1 (Nonverbal badges), Level 2 (Full subtext). | DOM inspection verifies zero subtext leakage at Level 0. |
| **FR-06** | DAG Timeline Forking | Calling `rewindTo(turnId)` resets active head without mutating historical node records. | Verify DAG branch creation and linear history retrieval. |
| **FR-07** | Safety Soft-Brake | When Tension Index $T \ge 9.0$, halt standard dialogue and trigger 4-second box-breathing modal. | Assert `co_regulation_recommended` flag emission on $T \ge 9.0$. |
| **FR-08** | Pocket Script Gen | Synthesize linear turn history into DBT DEAR MAN-aligned 2-sentence actionable script. | Assert clipboard copy event and valid script string. |

### 2.2 Non-Functional Latency Budget Breakdown

To preserve human conversational cadence, total round-trip latency is bounded at **1400ms (p95)**.

- **Pipeline 1:** Client Audio Capture & DSP Buffer Ingestion: $\le 45	ext{ms}$
- **Pipeline 2:** Speech-to-Text Recognition (Web Speech API): $\le 250	ext{ms}$
- **Pipeline 3:** Network Dispatch (HTTP/2 Edge Handshake): $\le 60	ext{ms}$
- **Pipeline 4:** Edge Validation & Payload Assembly (Zod parse): $\le 15	ext{ms}$
- **Pipeline 5:** LLM Structured Inference Time-to-First-Token: $\le 750	ext{ms}$
- **Pipeline 6:** Network Response Compression & Return: $\le 60	ext{ms}$
- **Pipeline 7:** Client SVG Parametric Recalculation (1 frame @ 60 FPS): $\le 16	ext{ms}$
- **Pipeline 8:** Web Speech Synthesis Audio Initialization: $\le 150	ext{ms}$

---

## 3. Mathematical Affect Model & Algorithmic DSP Pipeline

### 3.1 Mehrabian-Russell Vector Space Formalization

The affect state is modeled as an immutable 3D vector bounded within a normalized unit hypercube:

$$\mathbf{E} = [V, A, D]^T, \quad 	ext{where } V, A, D \in [-1.000, +1.000]$$

**Hard Clamping Invariant:**
$$x_{	ext{clamped}} = \max(-1.0, \min(1.0, x)) \quad orall x \in \{V, A, D\}$$

### 3.2 Discrete-Time Exponential Damping Equation

Temporal state transitions obey a first-order exponential smoothing differential equation to simulate psychological inertia and prevent visual popping:

$$\mathbf{E}(t+1) = \lambda \cdot \mathbf{E}(t) + (1 - \lambda) \cdot \Delta \mathbf{E}_{	ext{input}}$$

Where:
- $\mathbf{E}(t)$ is the current emotional coordinate vector.
- $\Delta \mathbf{E}_{	ext{input}}$ is the perturbation vector generated by the LLM reasoning core.
- $\lambda \in [0.0, 1.0]$ is the persona's dimensionless Emotional Inertia Coefficient (e.g., $\lambda = 0.65$ for flexible peers, $\lambda = 0.85$ for stressed managers).

### 3.3 Client-Side Audio DSP Algorithms (TypeScript)

The client extracts physical prosody metrics locally using an `AudioWorkletNode`/`AnalyserNode` sampling at 44.1kHz with window $N = 2048$.

```typescript
// CLIENT AUDIO DSP MODULE (AudioProsodyAnalyzer.ts)
export class AudioProsodyAnalyzer {
  private analyser: AnalyserNode;
  private buffer: Float32Array;

  constructor(analyserNode: AnalyserNode) {
    this.analyser = analyserNode;
    this.analyser.fftSize = 2048;
    this.buffer = new Float32Array(this.analyser.fftSize);
  }

  // 1. Root Mean Square (RMS) Volume Calculation
  public calculateRmsVolume(): number {
    this.analyser.getFloatTimeDomainData(this.buffer);
    let sumSquares = 0.0;
    for (let i = 0; i < this.buffer.length; i++) {
      sumSquares += this.buffer[i] * this.buffer[i];
    }
    return Math.sqrt(sumSquares / this.buffer.length);
  }

  // 2. Fundamental Frequency (F0) Extraction via Normalized Autocorrelation
  public detectFundamentalPitch(sampleRate: number): number {
    this.analyser.getFloatTimeDomainData(this.buffer);
    const SIZE = this.buffer.length;
    let r1 = 0, r2 = SIZE - 1;
    const thres = 0.2;

    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(this.buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(this.buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    const trimmed = this.buffer.slice(r1, r2);
    const c = new Float32Array(trimmed.length).fill(0);

    for (let lag = 0; lag < trimmed.length; lag++) {
      for (let i = 0; i < trimmed.length - lag; i++) {
        c[lag] += trimmed[i] * trimmed[i + lag];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < trimmed.length; i++) {
      if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }

    return maxpos > 0 ? sampleRate / maxpos : 0.0;
  }
}
```

### 3.4 Kinematic SVG Avatar Parameterization Formulae

The continuous VAD vector drives the 2D parametric vector avatar through deterministic kinematic functions:

- **Oral Kinematics:** $	ext{MouthCurvature}(V) = 	ext{clamp}(V 	imes 24.0, -24.0, 24.0)$ `[Quadratic Bezier Control Point Y]`
- **Ocular Kinematics:** $	ext{BrowAngle}(V, A) = 	ext{clamp}(-V 	imes 16.0 + A 	imes 8.0, -20.0, 20.0)$ `[Rotation Degrees]`
- **Blink Frequency:** $	ext{BlinkInterval}(A) = rac{3200	ext{ms}}{1.0 + 0.8 	imes \max(0.0, A)}$ `[Milliseconds]`
- **Respiratory Rhythm:** $	ext{BreathingPeriod}(A) = 3.6 - (A 	imes 1.4)$ `[Seconds per cycle]`
- **Somatic Posture:** $	ext{PosturalRotation}(D) = D 	imes 6.5$ `[Degrees tilt around torso anchor]`

---

## 4. Data Model & State Machine Specification

### 4.1 Core Domain Entities (TypeScript)

```typescript
// DOMAIN ENTITIES (src/domain/entities/)
export interface AffectVector {
  valence: number;   // [-1.000, 1.000]
  arousal: number;   // [-1.000, 1.000]
  dominance: number; // [-1.000, 1.000]
}

export interface TwoWayBridge {
  userIntent: string;     // Functional boundary need
  receivedImpact: string; // Neurotypical pragmatic interpretation
}

export interface ConversationNode {
  turnId: string;
  parentId: string | null;
  branchId: string;
  role: 'user' | 'persona' | 'system';
  content: string;
  inputMode: 'voice' | 'text';
  timestamp: number;
  affectSnapshot: {
    delta: AffectVector;
    resolved: AffectVector;
  };
  twoWayBridge?: TwoWayBridge;
  deEscalationWarning: boolean;
  pocketScriptPivot?: string;
}
```

### 4.2 Conversation Graph & Timeline Branching State Machine

The timeline is structured as an in-memory Directed Acyclic Graph (DAG) to enable non-destructive rewind, branching, and comparison without database round-trips.

```typescript
// DAG STATE MACHINE (ConversationTimelineGraph.ts)
export class ConversationTimelineGraph {
  private nodes: Map<string, ConversationNode> = new Map();
  private activeHeadId: string | null = null;

  public appendTurn(node: Omit<ConversationNode, 'turnId'>): string {
    const turnId = `turn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const fullNode: ConversationNode = { ...node, turnId };
    this.nodes.set(turnId, fullNode);
    this.activeHeadId = turnId;
    return turnId;
  }

  public rewindTo(turnId: string): void {
    if (!this.nodes.has(turnId)) {
      throw new Error(`Target turnId ${turnId} not found in timeline graph.`);
    }
    this.activeHeadId = turnId;
  }

  public getLinearHistory(headId: string | null = this.activeHeadId): ConversationNode[] {
    const history: ConversationNode[] = [];
    let currentId = headId;
    while (currentId !== null) {
      const node = this.nodes.get(currentId);
      if (!node) break;
      history.unshift(node);
      currentId = node.parentId;
    }
    return history;
  }
}
```

### 4.3 Tension Index & De-Escalation State Machine

**Tension Index formula:**
$$T = \left(rac{A - V + 2.0}{4.0}ight) 	imes 10.0 \in [0.0, 10.0]$$

- **State 1: Tier 1: Normal Simulation ($T < 7.0$):** Standard avatar morphing and dialogue progression.
- **State 2: Tier 2: Impact Warning ($7.0 \le T < 9.0$):** Audio playback held behind confirmation modal. UI prompts:
  > *"Heads-up: Alex is defensive. Continue, rephrase, or take a breather?"*
- **State 3: Tier 3: The Curtain Drop ($T \ge 9.0$):** Simulation halts immediately. Persona breaks character:
  > *"Let's step out of the scenario for a moment. Let's do a 30-second breath reset together."*
  Avatar triggers 4-second box-breathing rig.

---

## 5. API Specification & Data Contracts

### 5.1 `POST /api/v1/conversation/turn`

#### Request Payload

```json
// CONTRACT: POST /api/v1/conversation/turn
// REQUEST PAYLOAD:
{
  "scenario_id": "workplace_written_specs",
  "active_branch_id": "branch_main_01",
  "parent_turn_id": "turn_1717800000_a1b2c3",
  "user_input": {
    "text": "When instructions are only verbal, I get overwhelmed and miss key specifications.",
    "input_mode": "voice",
    "prosody": {
      "words_per_minute": 185,
      "volume_rms": 0.38,
      "pitch_variance_hz": 24.2
    }
  },
  "current_vad": {
    "valence": 0.100,
    "arousal": 0.200,
    "dominance": 0.300
  }
}
```

#### Response Payload (200 OK)

```json
// RESPONSE PAYLOAD (200 OK):
{
  "turn_id": "turn_1717800045_d4e5f6",
  "spoken_response": "I understand, but taking time to write recap emails for every check-in is a significant extra load on my day.",
  "unspoken_subtext": "I'm already working through lunch. If I agree to this, I'm taking on extra administrative work that I don't have time for.",
  "two_way_bridge": {
    "user_intent": "Self-advocacy to ensure delivery accuracy and eliminate cognitive overwhelm.",
    "received_as": "An administrative demand placed on the manager that criticizes their verbal briefing style."
  },
  "affect_computation": {
    "delta": { "valence": -0.420, "arousal": 0.510, "dominance": 0.220 },
    "resolved_vector": { "valence": -0.238, "arousal": 0.402, "dominance": 0.248 },
    "inertia_applied": 0.65
  },
  "avatar_kinematics": {
    "state_label": "defensive_guarded",
    "posture_cue": "Crossed arms tightly, torso angled 6 degrees away from screen",
    "mouth_curvature": -5.7,
    "brow_angle": 7.0,
    "blink_rate_ms": 2420,
    "breathing_cycle_sec": 3.03
  },
  "safety_gate": {
    "tension_index": 7.1,
    "trigger_warning": true,
    "warning_message": "Heads-up: Alex feels time-pressured. The upcoming response conveys defensive pushback.",
    "co_regulation_active": false
  },
  "pocket_script_pivot": {
    "recommended_text": "I want to save your time. What if I write a 2-minute bulleted recap after our meetings, and you just give it a quick thumbs-up?",
    "clinical_rationale": "Applies DBT Assertiveness: absorbs the administrative burden while obtaining the necessary written record."
  }
}
```

### 5.2 Error Contract & Envelope Schema

```json
// STANDARD ERROR ENVELOPE
{
  "error": {
    "code": "AFFECT_PROCESSING_FAILED",
    "message": "LLM failed to output parseable structured JSON conforming to VAD schema.",
    "request_id": "req_8f1a2c3d",
    "retryable": true,
    "fallback_state": {
      "spoken_response": "Could you rephrase that? I want to make sure I understand.",
      "unspoken_subtext": "Processing input...",
      "resolved_vector": { "valence": 0.0, "arousal": 0.0, "dominance": 0.0 }
    }
  }
}
```

---

## 6. Prompt Engineering & Inference Pipeline

The master system prompt is frozen and served via Edge functions. It enforces strict single-shot JSON output compliance without multi-agent round-trip overhead.

### Master System Prompt

```text
// MASTER SYSTEM PROMPT
(src/infrastructure/adapters/llm/PromptTemplates.ts)
export const CONVERSATION_SYSTEM_PROMPT = `
You are the simulation and affective computing engine for "Say It First",
an interactive communication sandbox for neurodivergent and autistic
individuals.

SCENARIO ID: {{scenario_id}}
PERSONA ARCHETYPE: {{persona_name}}
PERSONA CONTEXT: {{system_context}}
CURRENT VAD STATE: Valence={{current_v}}, Arousal={{current_a}},
Dominance={{current_d}}

EXECUTION RULES:
1. Roleplay realistically: Never break character unless Tension >= 9.0.
Act as an authentic, busy, neurotypical conversational partner who
responds to social subtext.
2. Calculate VAD Delta: Compute realistic emotional perturbations (ΔV,
ΔA, ΔD) strictly in range [-1.00, 1.00] based on the user's input and
prosodic delivery.
3. Compute Two-Way Subtext Bridge:
- "user_intent": State the underlying functional, sensory, or boundary
need of the user neutrally and non-judgmentally.
- "received_as": State how an unbuffered, direct neurotypical peer
perceives the statement.
4. Enforce DBT DEAR MAN: Generate a "pocket_script_pivot" that
achieves the user's goal without demanding masking or conceding
boundaries.

OUTPUT FORMAT:
You must output ONLY a valid, raw JSON object matching the following
structure:
{
  "spoken_response": string,
  "unspoken_subtext": string,
  "two_way_bridge": {
    "user_intent": string,
    "received_as": string
  },
  "emotional_delta": {
    "valence": float,
    "arousal": float,
    "dominance": float
  },
  "posture_cue": string,
  "pivot_recommendation": {
    "suggested_wording": string,
    "psychological_rationale": string
  }
}
`;
```

### Execution Knobs: Inference Hyperparameters

- **Model:** Target Model: `gemini-1.5-flash` (primary) / `claude-3-5-haiku-20241022` (failover)
- **Temperature:** `0.35` (tight distribution to prevent hallucinated affect deltas)
- **Sampling:** Top-P: `0.85`
- **Payload Budget:** Max Tokens: `450` tokens
- **Encoding:** Response Format: `application/json` (JSON Mode forced)

---

## 7. Architecture Decision Records (ADRs)

### ADR-001: Hexagonal Architecture vs. Monolithic Component Coupling
- **Status:** Accepted | **Date:** October 2026
- **Context:** The system combines Web Audio DSP, continuous differential equations, timeline DAG trees, and external LLM streaming. Direct implementation within React component state creates untestable race conditions and brittle code.
- **Decision:** Implement Hexagonal Architecture (Domain -> Application -> Infrastructure -> Presentation). All vector math, DAG operations, and DSP algorithms exist as standalone TypeScript classes completely decoupled from React and Next.js APIs.
- **Consequences:** Guarantees 100% test coverage for affect state transitions via Vitest/Jest without browser mocking. Decouples LLM provider contracts from client presentation.

### ADR-002: In-Memory Client DAG vs. Cloud Database Persistence
- **Status:** Accepted | **Date:** October 2026
- **Context:** The system requires non-destructive timeline rewind and branching. We must choose between cloud database persistence (Supabase/PostgreSQL) and client-side memory structures.
- **Decision:** Maintain the conversation tree as an in-memory Directed Acyclic Graph (DAG) in the client's Zustand state store.
- **Consequences:** Eliminates 100% of network round-trip overhead on timeline rewinds (0ms branching latency). Ensures complete privacy compliance by guaranteeing zero persistence of sensitive workplace accommodation disclosures. Prevents database outages from impacting live hackathon judging.

### ADR-003: Client-Side Web Audio DSP vs. Server-Side Audio Processing
- **Status:** Accepted | **Date:** October 2026
- **Context:** Extracting acoustic prosody (WPM, RMS volume, F0 pitch) can be executed in the browser or via streaming raw audio to server-side Python services.
- **Decision:** Execute all digital signal processing client-side in the browser using the Web Audio API `AnalyserNode` and Web Speech API.
- **Consequences:** Consumes 0 kbps server audio upload bandwidth. 0ms network latency for pitch/volume extraction. Server remains lightweight serverless Node.js. Dual-input mode ensures identical analytical payload fidelity whether the user speaks or types.

### ADR-004: Parametric Bezier SVG Kinematics vs. Generative Video Lip-Sync
- **Status:** Accepted | **Date:** October 2026
- **Context:** Avatar rendering could use generative video streaming APIs (SadTalker, Simli, HeyGen) or client-side SVG vector morphing.
- **Decision:** Construct a parametric 2D SVG vector avatar with Bezier control points programmatically bound to the continuous VAD coordinates.
- **Consequences:** 0ms video streaming lag. Renders at 60 FPS on any hardware. Avoids the 'Uncanny Valley' which triggers acute distress in autistic users. Eliminates GPU server infrastructure costs entirely.

---

## 8. Implementation Guide & Build Sequence

### 8.1 Environment Configuration (`.env.local`)

```bash
// ENVIRONMENT CONFIGURATION
# Core AI Inference Gateway
GEMINI_API_KEY="AIzaSy..."

# Fallback LLM Provider (Optional)
ANTHROPIC_API_KEY="sk-ant-..."

# Runtime Configuration
NEXT_PUBLIC_APP_ENV="development"
NEXT_PUBLIC_DEFAULT_INERTIA="0.65"
```

### 8.2 Execution Order for Engineering Sprint

- **Phase 1: HOURS 00 – 06:** Initialize Next.js 14 App Router project with TypeScript; implement domain entities (`AffectVector.ts`) and math services (`AffectDynamicsService.ts`); freeze Zod API validation schemas.
- **Phase 2: HOURS 06 – 16:** Build `AudioProsodyAnalyzer` using Web Audio `AnalyserNode` (FFT 2048); bind `webkitSpeechRecognition` hook; implement `/api/v1/conversation/turn` Next.js route with structured JSON output; verify latency $p95 < 1400	ext{ms}$.
- **Phase 3: HOURS 16 – 26:** Construct `AvatarSvgRig.tsx` binding mouth Bezier paths and brow angles to VAD; render `AffectRadarCanvas.tsx` Cartesian plot; build `SubtextHud.tsx` and Scaffolding Dial (0%, 50%, 100%).
- **Phase 4: HOURS 26 – 32:** Implement in-memory DAG `ConversationTimelineGraph` for rewind/branching; build `CoRegulationModal.tsx` triggering 4-second box-breathing on $	ext{Tension} \ge 9.0$; construct `PostSessionDebrief.tsx`.
- **Phase 5: HOURS 32 – 36:** Pre-seed deterministic mock fallbacks for offline demo safety; verify WCAG 2.1 AAA contrast levels across all UI states; rehearse 2-minute live demo sequence.

### 8.3 Smoke Testing & Verification Protocol

Run the following terminal command to verify API data contract, VAD computation, and error envelope:

```bash
// SMOKE TEST VERIFICATION (CURL)
curl -X POST http://localhost:3000/api/v1/conversation/turn   -H "Content-Type: application/json"   -d '{
    "scenario_id": "workplace_written_specs",
    "active_branch_id": "branch_root",
    "parent_turn_id": null,
    "user_input": {
      "text": "I need instructions in writing so I do not miss key details.",
      "input_mode": "voice",
      "prosody": {
        "words_per_minute": 140,
        "volume_rms": 0.25,
        "pitch_variance_hz": 18.0
      }
    },
    "current_vad": {
      "valence": 0.0,
      "arousal": 0.0,
      "dominance": 0.0
    }
  }'
```

**Verification Pass Criteria:**
- HTTP 200 OK with valid JSON matching response schema.
- Calculated VAD floats strictly within $[-1.0, 1.0]$.
- Non-empty `two_way_bridge` strings.
- Valid avatar kinematics parameters.
