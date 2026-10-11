<div align="center">

# Say It First <img src="https://media.giphy.com/media/mGcNjsfWAjY5AEZNw6/giphy.gif" width="38" alt="wave" />

### *A Neurodiversity-Affirming Conversational Sandbox Powered by Affective Computing & Bilateral Subtext Translation*

**Hacklanta 2026 • Social Good Track Flagship**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_DSP-44.1kHz-F6821F?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Gemini 1.5](https://img.shields.io/badge/Gemini_1.5-Flash_JSON-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-128_Passed-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1_AAA-10B981?style=for-the-badge)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br/>

> **"Communication breakdowns between neurodivergent and neurotypical people represent a bidirectional mismatch in pragmatic language styles, not a unilateral cognitive deficit."**  
> — *Damian Milton, The Double Empathy Problem*

</div>

---

## 💡 The Problem Space: Ending Forced Masking

For millions of autistic individuals, high-stakes conversations—such as requesting workplace sensory accommodations, setting boundaries, or navigating performance evaluations—carry intense anxiety. Traditional social rehearsal apps force autistic people to **mask**: suppressing their authentic traits to mimic neurotypicals at grave psychological cost and autistic burnout.

**Say It First** re-architects the communication sandbox into a **bilateral translation engine**:
- **Translates Pragmatic Subtext**: Clarifies what conversational partners mean beneath indirect language.
- **Bridges Intent vs. Impact**: Shows *"Your Stated Intent"* alongside *"Their Received Interpretation"*.
- **Empowers Non-Masking Self-Advocacy**: Synthesizes clinical **DBT DEAR MAN** scripts that achieve your accommodation needs without compromising boundaries.

```typescript
const sayItFirst = {
  mission: "Bilateral subtext translation without forced masking",
  coreMathematics: "Mehrabian-Russell 3D VAD Vector Space [-1.0, 1.0]³",
  affectKinematics: "2D Parametric Bezier SVG Avatar (60 FPS, 0ms GPU)",
  audioDSP: "Browser-native 44.1kHz AnalyserNode Autocorrelation F0/RMS",
  safetyProtocol: "Autonomous 3-Tier Tension Index with 4-count box breathing",
  latencyCeiling: "p95 < 1400ms (Single-shot structured inference)",
  privacy: "100% Zero-Retention ephemeral in-memory DAG"
};
```

---

## ⚡ Flagship Capabilities

<table>
  <tr>
    <td width="50%">
      <h3>🎭 2D Parametric Vector Avatar (ADR-004)</h3>
      <p>Continuous Mehrabian-Russell VAD coordinates deterministically drive a stylized 2D SVG avatar at 60 FPS without GPU cloud costs or Uncanny Valley distress.</p>
      <ul>
        <li><b>Mouth Bezier Curvature:</b> $Y = \text{clamp}(V \times 24.0, -24, 24)$</li>
        <li><b>Eyebrow Slant:</b> $\theta = \text{clamp}(-16V + 8A, -20^\circ, 20^\circ)$</li>
        <li><b>Somatic Lean:</b> Postural tilt $= D \times 6.5^\circ$</li>
      </ul>
    </td>
    <td width="50%">
      <h3>📡 Real-Time VAD Affect Radar</h3>
      <p>Live 2D Cartesian phase plot mapping Valence ($X \in [-1, 1]$) against Arousal ($Y \in [-1, 1]$) with glowing coordinate tracking and historical conversation trajectory trails.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🌉 Two-Way Subtext Bridge (FR-04)</h3>
      <p>Real-time bilateral translation revealing the pragmatic social gap: your core functional accommodation need compared directly against neurotypical emotional perception.</p>
    </td>
    <td width="50%">
      <h3>🎚️ Tactile Scaffolding Dial (FR-05)</h3>
      <p>Adjustable cognitive assistance dial with strict zero-leakage DOM guards:</p>
      <ul>
        <li><b>0% (Reality Mode):</b> Subtext hidden for realistic roleplay</li>
        <li><b>50% (Hints Mode):</b> Nonverbal posture badges enabled</li>
        <li><b>100% (Full X-Ray):</b> Unspoken thoughts and subtext exposed</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🌿 Safety Curtain Drop & Co-Regulation (FR-07)</h3>
      <p>When the Tension Index $T \ge 9.0$, simulation halts immediately. The persona drops character to guide a 30-second 4-count visual box-breathing reset (4s inhale, 4s hold, 4s exhale, 4s hold).</p>
    </td>
    <td width="50%">
      <h3>📝 Pocket Script Blueprint (FR-08)</h3>
      <p>Post-session synthesis screen generating a 2-sentence actionable script aligned with DBT DEAR MAN principles, ready to copy and deploy in real life.</p>
    </td>
  </tr>
</table>

---

## 📐 Mathematical Affect Engine

### Discrete-Time Exponential Damping (§3.2)
Human emotional state evolves smoothly over time, preventing visual snapping:

$$\mathbf{E}(t+1) = \lambda \cdot \mathbf{E}(t) + (1 - \lambda) \cdot \Delta \mathbf{E}_{\text{input}}$$

Where:
- $\mathbf{E}(t) = [V, A, D]^T$ is the current emotional coordinate vector, bounded within $[-1.0, 1.0]^3$.
- $\Delta \mathbf{E}_{\text{input}}$ is the turn perturbation generated by the LLM reasoning core.
- $\lambda = 0.65$ (adaptable peers) or $\lambda = 0.85$ (stressed supervisors).

### Tension Index & 3-Tier Safety Gate (§4.3, §8.2)
$$T = \left(\frac{A - V + 2.0}{4.0}\right) \times 10.0 \in [0.0, 10.0]$$

| Tension Score | Safety Tier | System Action |
| :---: | :---: | :--- |
| **$T < 7.0$** | **Tier 1: Normal Simulation** | Standard dialogue progression and subtle kinematic shifts. |
| **$7.0 \le T < 9.0$** | **Tier 2: Impact Warning** | Emits intercept notice: *"Heads-up: Alex feels defensive/time-pressured."* |
| **$T \ge 9.0$** | **Tier 3: The Curtain Drop** | Intercept modal halts simulation and guides 4-count visual box breathing. |

---

## 🏛️ Hexagonal Architecture Topology

Decoupled into 4 strict concentric hexagonal boundaries:

```text
src/
├── domain/                               # Pure Enterprise Logic (Zero external dependencies)
│   ├── entities/
│   │   ├── AffectVector.ts               # 3D Vector hypercube, clamps, distance metrics
│   │   ├── ConversationNode.ts           # Timeline node, turn metadata, branching pointers
│   │   ├── ConversationTimelineGraph.ts  # In-memory DAG state machine with non-destructive rewinding
│   │   └── TwoWayBridge.ts               # Stated intent vs. received impact data structure
│   ├── services/
│   │   ├── AffectDynamicsService.ts      # Exponential damping differential equations
│   │   ├── AvatarKinematicsService.ts    # Deterministic Bezier/rotation mapping formulas
│   │   └── TensionSophialuatorService.ts    # Mathematical safety gate computation
│   └── value-objects/
│       ├── ProsodyMetrics.ts             # WPM, RMS volume, F0 pitch variance
│       └── ScaffoldingLevel.ts           # 0% (Reality), 50% (Hints), 100% (X-Ray)
├── application/                          # Orchestration & Use Cases
│   ├── ports/
│   │   ├── in/ProcessTurnCommand.ts      # Command interface for turn processing
│   │   └── out/
│   │       ├── LLMInferencePort.ts       # Structured single-shot reasoning contract
│   │       ├── SessionRepositoryPort.ts  # DAG state storage contract
│   │       └── VoiceSynthesisPort.ts     # Speech synthesis contract
│   └── use-cases/
│       ├── ProcessTurnUseCase.ts         # Coordinates input -> LLM -> damping -> safety -> DAG
│       ├── BranchConversationUseCase.ts  # Non-destructive timeline rewind & DAG forking
│       └── GeneratePocketScriptUseCase.ts# Compiles debrief & 2-sentence DBT script
├── infrastructure/                       # External Frameworks, Network & Drivers
│   ├── adapters/
│   │   ├── llm/
│   │   │   ├── GeminiStructuredAdapter.ts# JSON Mode implementation with Zod schema validation
│   │   │   └── PromptTemplates.ts        # Versioned system prompt definitions
│   │   └── storage/
│   │       └── InMemorySessionRepo.ts    # Ephemeral thread-safe session map (0 cloud persistence)
│   └── web-audio/
│       ├── AudioProcessor.ts             # Web Audio API Context & AnalyserNode bindings
│       └── ProsodyExtractor.ts           # Autocorrelation F0, RMS, zero-crossing DSP (44.1kHz)
└── presentation/                         # User Interface & Controllers
    ├── api/routes/conversation.ts        # Route Controller (POST /api/v1/conversation/turn)
    ├── components/
    │   ├── AffectRadarCanvas.tsx         # 2D Cartesian phase plot (Valence x Arousal)
    │   ├── AvatarSvgRig.tsx              # Parametric Bezier curve morphing avatar
    │   ├── SubtextHud.tsx                # Two-Way Bridge, Thought Bubble, Scaffolding Dial
    │   ├── InputDock.tsx                 # Push-to-Talk audio streamer & text input
    │   ├── CoRegulationModal.tsx         # Tier 3 4-count box-breathing overlay
    │   └── PostSessionDebrief.tsx        # Debrief analysis & copyable pocket script
    └── hooks/
        ├── useWebAudioProsody.ts         # Audio capture & local DSP calculation hook
        └── useTimelineBranching.ts       # React state interface for DAG timeline & scaffolding
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v18.x` or `v20.x`
- **npm**: `v9.x`+

### 2. Installation
```bash
git clone https://github.com/say-it-first/say-it-first.git
cd say-it-first
npm install
```

### 3. Environment Configuration
Copy the template and configure your API keys in `.env.local`:
```bash
cp .env.example .env.local
```

Configure your environment variables:
| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | **Yes** | Powers generative dialogue and intent translation ([Google AI Studio](https://aistudio.google.com/app/apikey)). |
| `ELEVENLABS_API_KEY` | **Yes** | Required for agent provisioning. |
| `ELEVENLABS_AGENT_ID` | **Yes** | The ElevenLabs conversational agent ID configured for PCM 24000 Hz. |
| `HEYGEN_API_KEY` | **Yes** | Powers real-time WebRTC live video streaming via HeyGen LiveAvatar's Speech-to-Video API. |
| `HEYGEN_AVATAR_ID` | **Yes** | HeyGen LiveAvatar identifier (defaults to `Sophia`). |

> **Note on Live Video Avatar Pipeline:**
> - **With HeyGen + ElevenLabs Agent**: Initiates a low-latency WebRTC video stream directly via LiveKit with 24kHz linear PCM audio viseme synchronization.
> - **Fail-Fast Diagnostics**: If `HEYGEN_API_KEY` is not configured, the session endpoint safely returns a 503 instead of exposing credentials.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification Benchmarks & Smoke Test

### Full Vitest Suite (128 / 128 Passing)
```bash
npx vitest run
```
```text
 ✓ tests/domain/AffectDynamicsService.test.ts (25 tests)
 ✓ tests/domain/AffectVector.test.ts (37 tests)
 ✓ tests/domain/ConversationNode.test.ts (4 tests)
 ✓ tests/domain/ConversationTimelineGraph.test.ts (3 tests)
 ✓ tests/domain/ProsodyMetrics.test.ts (4 tests)
 ✓ tests/domain/ScaffoldingLevel.test.ts (4 tests)
 ✓ tests/domain/TensionSophialuatorService.test.ts (10 tests)
 ✓ tests/domain/TwoWayBridge.test.ts (4 tests)
 ✓ tests/application/use-cases/BranchConversationUseCase.test.ts (2 tests)
 ✓ tests/application/use-cases/GeneratePocketScriptUseCase.test.ts (2 tests)
 ✓ tests/application/use-cases/ProcessTurnUseCase.test.ts (1 test)
 ✓ tests/infrastructure/AudioProsodyAnalyzer.test.ts (6 tests)
 ✓ tests/infrastructure/GeminiStructuredAdapter.test.ts (4 tests)
 ✓ tests/infrastructure/InMemorySessionRepo.test.ts (2 tests)
 ✓ tests/infrastructure/PromptTemplates.test.ts (2 tests)
 ✓ tests/presentation/conversationRoute.test.ts (3 tests)
 ✓ tests/presentation/useTimelineBranching.test.ts (2 tests)
 ✓ tests/presentation/useWebAudioProsody.test.ts (2 tests)
 ✓ tests/presentation/components/AvatarSvgRig.test.ts (5 tests)
 ✓ tests/presentation/components/CoRegulationModal.test.ts (2 tests)
 ✓ tests/presentation/components/PostSessionDebrief.test.ts (1 test)
 ✓ tests/presentation/components/SubtextHud.test.ts (3 tests)

 Test Files  22 passed (22)
      Tests  128 passed (128)
```

### cURL API Verification (§8.3)
```bash
curl -X POST http://localhost:3000/api/v1/conversation/turn \
  -H "Content-Type: application/json" \
  -d '{
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

---

## 🔒 Security & Privacy Guarantee (NFR-04)

- **0 kbps Cloud Audio Uploads**: Acoustic prosody (WPM, RMS volume, F0 pitch autocorrelation) is extracted client-side. Microphone audio never leaves your browser.
- **Ephemeral DAG**: Timeline state is held in an in-memory session graph (`InMemorySessionRepo`). Sensitive accommodation disclosures are never written to disk or external databases.

---

## 📜 Architectural Decision Records (ADRs)

| ADR | Decision | Rationale |
| :---: | :--- | :--- |
| **ADR-001** | Hexagonal Ports and Adapters | Decouples browser Web Audio DSP from backend LLM reasoning; ensures 100% test coverage. |
| **ADR-002** | In-Memory Client DAG | Guarantees 0ms timeline rewind latency and zero persistence of sensitive disclosures. |
| **ADR-003** | Client-Side Web Audio DSP | Consumes 0 kbps server bandwidth; provides 0ms pitch/cadence feature extraction. |
| **ADR-004** | Parametric Bezier SVG Avatar | Renders at 60 FPS on any hardware; eliminates Uncanny Valley and GPU streaming costs. |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details. Built with empathy for **Hacklanta 2026 Social Good Track**.
