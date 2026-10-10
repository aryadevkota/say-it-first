# Contributing to Say It First

Thank you for contributing to **Say It First**, an open-source, neurodiversity-affirming conversation sandbox built for autistic and neurodivergent self-advocacy.

---

## 1. Architectural Ground Rules: Hexagonal Strictness

The codebase follows a strict **Hexagonal Architecture (Ports and Adapters)** pattern. Every pull request must respect layer boundaries:

```text
src/
├── domain/         # PURE DOMAIN LOGIC: Zero external dependencies.
│                   # Contains AffectVector, ConversationTimelineGraph, TwoWayBridge,
│                   # AffectDynamicsService, TensionEvaluatorService, ProsodyMetrics.
├── application/    # ORCHESTRATION: Inbound/outbound ports and use cases.
│                   # Only imports from src/domain/ and internal ports.
├── infrastructure/ # EXTERNAL IMPLEMENTATIONS: Gemini LLM adapter, Web Audio AnalyserNode DSP,
│                   # and in-memory thread-safe repositories.
└── presentation/   # UI & ROUTES: Next.js App Router route handlers, React SVG Avatar rig,
                    # HUD canvas, and reactive state hooks.
```

### Core Invariants:
1. **Zero External Dependencies in `src/domain/`**: The domain layer cannot import from `npm` packages, React, Next.js, or outer hexagonal layers.
2. **Hard Mathematical Clamping**: All VAD values must strictly satisfy $V, A, D \in [-1.0, 1.0]$.
3. **Double Empathy Alignment**: Never frame autistic communication as defective. Provide bilateral translation of intent versus impact.
4. **Zero-Retention Guarantee (NFR-04)**: No user voice recordings, disclosures, or transcripts may be stored in external cloud databases.

---

## 2. Development & Verification Workflow

### Prerequisites
- Node.js `18.x` or `20.x`
- npm `9.x`+

### Setup
```bash
git clone https://github.com/say-it-first/say-it-first.git
cd say-it-first
cp .env.example .env.local
npm install
```

### Running Tests Locally (TDD)
```bash
# Run all 128 tests
npx vitest run

# Watch mode for active development
npx vitest
```

### Type Checking & Production Build
```bash
# TypeScript compiler check
npx tsc --noEmit

# Next.js 14 production build
npm run build
```

---

## 3. Commit Message Conventions

We use standard Conventional Commits:
- `feat(domain): ...` (New mathematical services, entities, or value objects)
- `feat(application): ...` (New ports or orchestrator use cases)
- `feat(infra): ...` (Adapters, LLM schemas, or Web Audio DSP)
- `feat(ui): ...` (Components, avatar kinematics, or sensory tokens)
- `test: ...` (Vitest unit and integration suites)
- `fix: ...` (Bug fixes and parameter corrections)
