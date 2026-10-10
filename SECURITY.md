# Security Policy & Zero-Retention Privacy Guarantee

## Zero-Retention Privacy Commitment (NFR-04)

**Say It First** is designed as a clinical and psychological safe space for autistic individuals to rehearse high-stakes workplace accommodation requests, medical self-advocacy, and personal boundary setting.

### Privacy Guarantees by Design:
1. **0 kbps Cloud Audio Uploads (ADR-003)**: All audio digital signal processing (cadence WPM, volume RMS, autocorrelation pitch F0) executes 100% locally in the browser using Web Audio `AnalyserNode`. Raw audio PCM buffers are never transmitted over the network.
2. **Ephemeral In-Memory DAG (ADR-002)**: The conversational timeline graph is stored in temporary in-memory structures (`InMemorySessionRepo`). No disclosures, transcripts, or personal messages are persisted to cloud databases (PostgreSQL, Supabase, Firebase, or MongoDB).
3. **No Training on Sensitive Disclosures**: Inference calls to Google Gemini 1.5 Flash utilize enterprise edge API endpoints with zero data retention and zero training on API inputs.

---

## Supported Versions

| Version | Supported |
| :--- | :---: |
| 1.0.x (Current) | :white_check_mark: |
| < 1.0.0 | :x: |

---

## Reporting a Vulnerability

If you discover a security vulnerability or unintended privacy leak in **Say It First**, please disclose it responsibly:

1. **Do NOT open a public GitHub issue.**
2. Send an email to `security@sayitfirst.org` (or report via GitHub Private Security Advisories) with:
   - Detailed description of the issue.
   - Steps to reproduce or proof-of-concept payload.
   - Any potential impact on client-side DSP or privacy boundaries.

We will acknowledge receipt within **24 hours** and provide a patch timeline within **72 hours**.
