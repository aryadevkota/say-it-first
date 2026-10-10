# Say It First: The Social Cue & Conversation Sandbox

**A Neurodiversity-Affirming Conversational Sandbox Powered by Affective Computing & Bilateral Subtext Translation**

*Hacklanta 2026 | Social Good Track Technical Specification*

| Field | Value |
| :--- | :--- |
| **Project** | Say It First |
| **Track** | Social Good Track |
| **Date** | October 2026 |
| **Engineering Version** | v1.0.0-MVP-Arch |

---

## 1. Executive Summary & Problem Space

For millions of autistic and neurodivergent individuals, navigating interpersonal communication is characterized by profound, invisible friction. Traditional workplace, social, and healthcare environments depend heavily on implicit unwritten rules, indirect hints, shifting emotional subtext, and ambiguous nonverbal signals. Critical interactions—such as requesting workplace sensory accommodations, clarifying opaque project deliverables, setting interpersonal boundaries, or navigating performance evaluations—carry extraordinarily high emotional and career stakes.

To cope, autistic individuals frequently engage in exhaustive mental scripting and rehearsal. However, unguided rehearsal often compounds anxiety, creating self-doubt and cognitive paralysis. When entering conversations, minor differences in pragmatic language can lead to misinterpretation, interpersonal defensiveness, and autistic burnout.

### The Double Empathy Problem: Re-architecting the Solution Paradigm

In modern cognitive science and autism studies, communication friction is defined by Damian Milton's Double Empathy Problem: communication breakdowns between neurodivergent and neurotypical people represent a bidirectional mismatch in pragmatic communication styles, not a unilateral cognitive deficit.

Traditional social coaching tools force autistic individuals to mask—suppressing natural communication traits to mimic neurotypicals at great psychological cost.

**Say It First** acts as a bidirectional translation sandbox: rather than telling users they communicated 'wrong,' it translates the implicit perspective of the interlocutor, highlights the gap between intent and reception, and provides empowering, non-masking boundary phrasing.

---

## 2. Requirements Scoping & MVP Boundaries

To guarantee delivery within Hacklanta's 36-hour sprint window while preserving architectural integrity, requirements are scoped strictly across functional, non-functional, and explicit out-of-scope boundaries.

### 2.1 Functional Requirements

- **FR-01: Curated Scenario Engine:** Provide structured high-stakes scenarios (Workplace Accommodation, Social Event Boundaries, Ambiguity Clarification).
- **FR-02: Dual-Modality Input Dock:** Seamless push-to-talk microphone audio streaming with an identical, first-class silent text-input toggle.
- **FR-03: Affective State Calculation:** Continuous 3D vector calculation (Valence, Arousal, Dominance) updated on every turn.
- **FR-04: Two-Way Subtext Bridge:** Real-time visual comparison showing 'Your Stated Intent' vs. 'Their Received Interpretation'.
- **FR-05: Tactile X-Ray Scaffolding Dial:** Dynamic adjustment of cognitive support from 0% (Reality Mode) to 50% (Cue Highlights) to 100% (Full X-Ray).
- **FR-06: Non-Destructive Rewind & Branching:** Timeline scrubbing allowing users to jump back, modify phrasing, and spawn divergent conversational trees.
- **FR-07: Autonomous Co-Regulation Protocols:** Automated de-escalation soft-brakes and guided 4-count visual box breathing when tension exceeds thresholds.
- **FR-08: The Pocket Script Blueprint:** Synthesis screen generating an actionable 2-sentence script ready for real-world deployment.

### 2.2 Non-Functional Constraints

- **NFR-01: Latency Ceiling:** Round-trip processing (voice capture to avatar state update and response) must maintain $p95 < 1.4	ext{ seconds}$.
- **NFR-02: Sensory-Calm Accessibility:** WCAG 2.1 AAA contrast compliance, zero-motion toggles, and OpenDyslexic font support.
- **NFR-03: Client-Side DSP Execution:** Prosody extraction and VAD kinematics must run in the browser to survive hackathon network volatility.
- **NFR-04: Zero-Retention Privacy:** No audio streams, personal disclosures, or transcripts are persisted to external databases.

### 2.3 Out-of-Scope (Hackathon MVP Cut-Line)

- **OOS-01:** Photorealistic 3D avatar rendering or deepfake video generation (avoids high compute costs, latency spikes, and Uncanny Valley aversion).
- **OOS-02:** Persistent cloud user profiles, multi-device sync, or enterprise authentication.
- **OOS-03:** Automated psychiatric diagnosis or formal clinical medical evaluations.
- **OOS-04:** Multi-participant group conversational dynamics (strictly 1-on-1 dyads for MVP).

---

## 3. Mathematical Affect Model & Empirical Grounding

To prevent the simulator from acting as an ungrounded, hallucinating chatbot, emotional states are governed by continuous mathematics drawn from affective computing: Russell’s Circumplex Model of Affect and Mehrabian’s Valence-Arousal-Dominance (VAD) vector space.

### 3.1 The Continuous 3D Affect Coordinate Space

Every conversational interlocutor's internal psychological state is represented by a 3D coordinate vector bounded within the cube $[-1.0, +1.0]^3$:

$$\mathbf{E} = [V, A, D]^T$$

1. **Valence ($V \in [-1.0, +1.0]$):** Degree of pleasure versus displeasure. Negative values denote offense, cognitive overwhelm, or resentment; positive values denote alignment, relief, and validation.
2. **Arousal ($A \in [-1.0, +1.0]$):** Degree of neurophysiological activation. Low values represent disengagement, calm, or fatigue; high values represent fight-or-flight, defensiveness, or urgency.
3. **Dominance ($D \in [-1.0, +1.0]$):** Degree of perceived social control and agency. Low values indicate vulnerability or feeling backed into a corner; high values indicate authority, assertion, or guarded territoriality.

#### Persona Affect State Benchmarks

| Persona State | Valence ($V$) | Arousal ($A$) | Dominance ($D$) | Observable Nonverbal Cue |
| :--- | :---: | :---: | :---: | :--- |
| **Warmly Receptive** | $+0.70$ | $+0.10$ | $+0.30$ | Soft eye contact, open shoulder posture, rhythmic nodding. |
| **Defensive / Guarded** | $-0.50$ | $+0.70$ | $+0.60$ | Folded arms, clenched jaw, accelerated vocal cadence. |
| **Overwhelmed / Confused** | $-0.30$ | $+0.50$ | $-0.60$ | Furrowed brow, broken eye contact, prolonged hesitations. |
| **Dismissive / Detached** | $-0.20$ | $-0.40$ | $+0.50$ | Glancing at watch/screen, leaning away, monosyllabic replies. |
| **Grounding / Co-Regulated** | $+0.40$ | $-0.60$ | $+0.10$ | Relaxed shoulders, lowered pitch baseline, rhythmic 4s breathing. |

### 3.2 Temporal Emotional Inertia Damping Equation

Human interlocutors possess psychological momentum. An individual who is defensive does not instantly become enthusiastic from a single polite phrase. The model computes temporal state evolution using a first-order exponential smoothing differential equation:

$$\mathbf{E}(t+1) = \lambda \cdot \mathbf{E}(t) + (1 - \lambda) \cdot \Delta \mathbf{E}_{	ext{input}}$$

Where:
- $\mathbf{E}(t)$ is the current emotional coordinate vector.
- $\Delta \mathbf{E}_{	ext{input}}$ is the perturbation vector generated by the user's latest statement and prosodic delivery.
- $\lambda \in [0.0, 1.0]$ represents the **Emotional Inertia Coefficient** (configured per persona, e.g., $\lambda = 0.65$ for adaptable peers; $\lambda = 0.85$ for stressed supervisors).

### 3.3 Client-Side Acoustic Prosody Signal Processing

To eliminate reliance on text alone, the browser's Web Audio API extracts objective acoustic metrics from the user's microphone in real time:

- **Cadence Metric — Speech Cadence (Words Per Minute):** Speaking at $>180	ext{ WPM}$ with near-zero inter-phrase pauses automatically injects $\Delta A = +0.25$ into the persona's arousal, modeling cognitive listener overload.
- **Volume Variance — Root Mean Square (RMS) Energy:** Unintended decibel spikes apply $\Delta D = +0.20$ and $\Delta V = -0.30$, triggering defensive postural reflex.
- **Prosody Stability — Pitch Contour Stability (F0 Autocorrelation):** Pitch instability or monotone delivery modulates the persona's perception of user comfort and clarity.

### 3.4 Kinematic SVG Avatar Parameterization

The continuous VAD vector drives the 2D parametric vector avatar through deterministic kinematic functions:

- **Oral Rig:** $	ext{Mouth Curvature} = V 	imes 24.0^\circ$ (convex smile for $V > 0$; concave grimace for $V < 0$).
- **Ocular Rig:** $	ext{Eyebrow Slant} = -V 	imes 16.0^\circ + A 	imes 8.0^\circ$ (furrowed brow under high-arousal stress).
- **Autonomic Rig:** $	ext{Blink Interval} = rac{	ext{base\_interval}}{1.0 + 0.8 	imes A}$ (accelerated blink rate under acute cognitive arousal).
- **Postural Rig:** $	ext{Head \& Shoulder Tilt} = D 	imes 6.5^\circ$ (forward assertive lean vs. withdrawn defensive slouch).

---

## 4. System Architecture & Topology

The architecture is engineered for sub-1.4 second latency, offline resilience, and modular hackathon development.

### 1. Client Layer: Client Browser Architecture (React / Next.js)
- **Audio DSP Engine:** Captures Web Audio stream, runs `AnalyserNode` FFT, and calculates WPM/RMS prosody metrics.
- **Speech Recognition Hook:** Web Speech API (`webkitSpeechRecognition`) running 100% locally with 0ms server latency.
- **Parametric SVG Avatar Viewport:** CSS hardware-accelerated vector morphing driven by continuous VAD coordinates.
- **Interactive Timeline Tree:** Local React state tree managing non-destructive conversational branching and rewind checkpoints.

### 2. Edge Layer: Application Edge Gateway (Next.js Serverless Route)
- **Endpoint:** `/api/chat` handles payload validation, rate-limiting, and context assembly.
- **Prompt Synthesizer:** Merges scenario state, persona archetype, DBT/NVC behavioral rubrics, and VAD historical context.
- **Structured Output Orchestrator:** Enforces strict JSON Schema validation on external LLM inference.

### 3. AI Layer: External Inference Services
- **Reasoning Core:** Gemini 1.5 Flash or Claude 3.5 Haiku executing single-shot structured JSON generation.
- **Voice Synthesis:** Web Speech API (`speechSynthesis`) for zero-latency client audio, with optional ElevenLabs streaming integration.

---

## 5. API Design & Data Contracts

To enable concurrent engineering, the client-server boundary is defined by a strictly typed JSON contract.

### 5.1 Request Contract: `POST /api/chat`

```json
// REQUEST SCHEMA: POST /api/chat
{
  "scenario_id": "workplace_written_specs",
  "branch_id": "branch_root",
  "history": [
    {
      "turn_id": "turn_001",
      "role": "persona",
      "text": "Hey, do you have a minute to run through the project rollout?"
    }
  ],
  "user_input": {
    "text": "When you only talk at my desk, I get overwhelmed and miss deadlines.",
    "input_mode": "voice",
    "prosody": {
      "words_per_minute": 182,
      "volume_rms": 0.44,
      "pitch_variance_hz": 26.8
    }
  },
  "current_vad": {
    "valence": 0.10,
    "arousal": 0.20,
    "dominance": 0.30
  }
}
```

### 5.2 Response Contract: Single-Shot JSON Output

```json
// RESPONSE SCHEMA: 200 OK
{
  "turn_id": "turn_002",
  "spoken_response": "I see. Sending emails for every task takes a lot of time on my end, honestly.",
  "unspoken_subtext": "I'm already working late every night. Writing recap memos feels like an administrative chore I don't have time for.",
  "two_way_bridge": {
    "user_intent": "Self-advocacy to protect cognitive accuracy and prevent missed deliverables.",
    "received_as": "A direct critique of managerial communication style and an added administrative burden."
  },
  "emotional_delta": {
    "valence": -0.42,
    "arousal": 0.48,
    "dominance": 0.22
  },
  "calculated_vad": {
    "valence": -0.24,
    "arousal": 0.38,
    "dominance": 0.26
  },
  "avatar_kinematics": {
    "state_label": "defensive_guarded",
    "posture_cue": "Crossed arms, tight jaw, leans back from desk",
    "micro_expressions": {
      "brow_furrow": 0.68,
      "lip_compression": 0.60,
      "blink_multiplier": 1.35
    }
  },
  "de_escalation": {
    "tension_level": 7,
    "trigger_warning": true,
    "warning_message": "Heads-up: Alex feels pressed for time. The upcoming response contains defensive friction.",
    "co_regulation_recommended": false
  },
  "pivot_recommendation": {
    "suggested_wording": "I absorb complex specs best in bullet points. What if I write a 2-minute recap after our chats, and you give it a quick thumbs-up?",
    "psychological_rationale": "Transfers the writing effort onto the employee while securing the written record required for cognitive clarity."
  }
}
```

---

## 6. Frontend Architecture & Sensory-Friendly UI

The interface is purposefully designed for neurodivergent sensory profiles, replacing visual clutter with calm, structured affordances.

### 6.1 Sensory-Calm Modern Design Tokens

- **Tokens — Color Palette:** Grounded Warm Slate (`#0F141C`) background, Midnight Navy (`#1A2232`) card containers, Bioluminescent Violet (`#8B5CF6`) subtext surfaces, and Sage (`#10B981`) grounding accents.
- **Typography:** Atkinson Hyperlegible rendered at 11pt body floor with 1.6 line-height to reduce optical crowding.
- **Motion — Motion Governance:** Zero jarring scale bounces. All layout updates utilize 200ms linear opacity transitions; zero-motion toggle replaces animations with static states.

### 6.2 Screen Topology Breakdown

- **Panel 1: The Stage (Left Panel):** Displays the responsive SVG avatar, live nonverbal cue pill (e.g., `[Posture: Crossed arms]`), and spoken dialogue captions.
- **Panel 2: The Subtext Lab (Right Panel):** Houses the 2D VAD Affect Radar canvas, the live Unspoken Thought Bubble, and the Two-Way Bridge (Intent vs. Impact).
- **Panel 3: The Control Dock (Bottom):** Tactile push-to-talk mic button, accessible keyboard text-entry field, Undo/Rewind button, and Scaffolding Dial (0% – 100%).

---

## 7. Architecture Decision Records (ADRs)

Significant architectural trade-offs are documented under the standard Architecture Decision Record format.

### ADR-001: Single-Shot Structured JSON Inference vs. Multi-Agent Sequential Pipeline
- **Status:** Accepted | **Date:** October 2026
- **Context:** Generating persona dialogue, subtext, nonverbal cues, and VAD math could be decomposed into multiple specialized agents (Actor, Psychologist, Evaluator).
- **Decision:** Consolidate all reasoning into a single LLM inference call returning a strongly typed, deterministic JSON schema.
- **Consequences (Positive):** Keeps end-to-end turnaround latency under 1.4s (vital for conversational presence). Eliminates multi-agent network overhead and reduces API token costs by 65%.
- **Consequences (Negative):** Requires strict Zod schema validation to handle occasional malformed JSON strings.

### ADR-002: Continuous VAD Coordinates vs. Discrete Emotional Categorization
- **Status:** Accepted | **Date:** October 2026
- **Context:** Most emotional simulators output static text labels ('angry', 'happy', 'defensive').
- **Decision:** Ground all persona affective states in continuous 3D Mehrabian-Russell VAD coordinates.
- **Consequences (Positive):** Enables realistic emotional inertia and smooth temporal damping via differential equations. Provides an auditable, scientific mathematical framework for hackathon judges.
- **Consequences (Negative):** Requires writing mathematical interpolation functions (`mapRange`, `clamp`) to connect coordinates to SVG kinematic paths.

### ADR-003: Client-Side Web Audio Prosody vs. Server-Side Audio Processing
- **Status:** Accepted | **Date:** October 2026
- **Context:** Analyzing vocal cadence (WPM) and volume variance could be processed by streaming raw audio to server-side Python services.
- **Decision:** Execute all digital signal processing client-side using browser-native Web Audio API `AnalyserNode` and Web Speech API.
- **Consequences (Positive):** Zero backend bandwidth load, 0ms extraction latency, 100% privacy compliance (no voice recordings stored), and zero server compute cost.
- **Consequences (Negative):** Speech recognition accuracy depends on browser audio drivers. Mitigated by providing an identical, first-class silent text-input mode.

### ADR-004: Parametric 2D Vector/SVG Rig vs. Generative Video Lip-Sync
- **Status:** Accepted | **Date:** October 2026
- **Context:** Photorealistic human video avatars can be streamed via generative APIs (SadTalker, Simli, HeyGen).
- **Decision:** Deploy a stylized, parametric 2D SVG vector avatar modulated via CSS and SVG path morphing.
- **Consequences (Positive):** 0ms streaming lag, zero GPU hosting cost, 100% reliability on unpredictable hackathon Wi-Fi, and complete circumvention of the Uncanny Valley which triggers acute distress in autistic users.
- **Consequences (Negative):** Lacks photorealism. Mitigated by intentional, high-craft modern editorial illustration.

---

## 8. Clinical & Psychological Safety Framework

Simulating high-stakes emotional interactions carries the risk of triggering genuine psychological distress. The system implements clinical safeguards drawn from Dialectical Behavior Therapy (DBT) and Nonviolent Communication (NVC).

### 8.1 Behavioral Phrasing Protocols

1. **DBT DEAR MAN Framework:** Alternative pivots are structured around **D**escribe (facts), **E**xpress (I-statements), **A**ssert (clear needs), **R**einforce (mutual benefit), **M**indful (focus on objective), **A**ppear confident, and **N**egotiate (viable compromises).
2. **Situation-Behavior-Impact (SBI):** Eliminates character assassinations (*"You are being unreasonable"*) in favor of objective impact statements (*"When instructions are only verbal, I lack a reference to verify accuracy"*).

### 8.2 Autonomous Three-Tier De-Escalation Gate

The system continuously tracks a mathematical Tension Index:

$$T = \left(rac{A - V + 2}{4}ight) 	imes 10 \in [0, 10]$$

- **Tier 1: Normal Practice ($T = 0 	ext{ to } 6$):** Standard simulation with dynamic VAD visual shifts.
- **Tier 2: Impact Warning ($T = 7 	ext{ to } 8$):** The interface pauses and surfaces an inline Intercept Card:
  > *"Heads-up: Alex feels defensive. Their next response carries high friction. Do you want to hear it, rephrase your point, or take a breather?"*
- **Tier 3: The Curtain Drop & Co-Regulation ($T \ge 9$):** The simulation halts immediately. The persona drops character entirely:
  > *"Hey, let's step out of the scenario for a moment. That was a high-friction exchange. Let's do a 30-second breath reset together."*
  The avatar switches to a neutral, supportive posture guiding a 4-count box-breathing cycle.

---

## 9. 36-Hour Hackathon Execution Roadmap

The roadmap allocates engineering bandwidth across five sequential sprint phases designed for a 3-person technical team.

| Phase | Sprint Window | Key Deliverables | Owner |
| :--- | :--- | :--- | :--- |
| **Phase 1: Foundation** | Hours 0 – 6 | Lock JSON schema, init Next.js repo, configure Tailwind design tokens, wire mock API data to UI layout. | Full Team |
| **Phase 2: Core Loop** | Hours 6 – 16 | Build Web Audio DSP prosody extractor, wire Web Speech API, implement `/api/chat` with structured Gemini 1.5 Flash. | AI / Backend Lead |
| **Phase 3: Visual Rig & HUD** | Hours 16 – 26 | Build parametric SVG avatar with VAD kinematic morphing, render 2D Affect Radar canvas, build Two-Way Bridge. | Frontend / UX Lead |
| **Phase 4: Branching & Debrief** | Hours 26 – 30 | Code timeline state tree for rewind/branching, wire co-regulation modal, code Pocket Script synthesizer. | Full Team |
| **Phase 5: Rehearsal & Pitch** | Hours 30 – 36 | Audit latency, pre-seed local fallback data for hackathon Wi-Fi safety, record 2-minute live demo video. | Product / Pitch Lead |

**Engineering Delivery Guarantee:** By grounding *Say It First* in empirical affective computing, single-shot structured inference, and sensory-calm accessibility, this specification provides an end-to-end blueprint to deploy a functional, high-impact Social Good contender within the 36-hour Hacklanta sprint window.
