## Description
<!-- Provide a clear, concise summary of the changes made and the problem being solved. -->

## Hexagonal Layer(s) Affected
- [ ] `src/domain/` (Pure enterprise logic — Zero external dependencies)
- [ ] `src/application/` (Ports & Use Cases — Inward dependencies only)
- [ ] `src/infrastructure/` (Adapters, LLM schemas, Web Audio DSP)
- [ ] `src/presentation/` (App Router routes, UI components, hooks)

## Architectural Integrity Checklist
- [ ] **Hexagonal Boundary Enforcement**: Zero external dependencies in `src/domain/`.
- [ ] **Mathematical Invariants**: All VAD operations bounded strictly by $[-1.0, 1.0]$.
- [ ] **Safety Protocols**: Evaluates Tension Index $T$ and respects 3-Tier safety gates.
- [ ] **Zero-Retention Guarantee**: No audio PCM, user disclosures, or transcripts written to persistent external databases.
- [ ] **Sensory-Friendly Design**: WCAG 2.1 AAA contrast compliant; supports zero-motion mode.

## Testing & Verification
- [ ] Added unit tests covering new features/fixes.
- [ ] Full Vitest suite passes locally (`npx vitest run`).
- [ ] Production Next.js build succeeds (`npm run build`).

## Related Issues
Fixes #
