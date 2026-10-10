# AstroVision AI — Interview Demo Script

## Preparation

1. Start Ollama and ensure `qwen2.5vl:3b` is installed (`ollama list`).
2. Start the application from the repository root with `docker compose up --build -d`.
3. Confirm `http://localhost:8080/api/health` is healthy.
4. Confirm `http://localhost:8080/api/ai/status` reports `reachable: true` and `modelAvailable: true`.

## 3–5 minute walkthrough

1. **Introduce the product:** “AstroVision is a local-first full-stack demo using React, Spring Boot, MongoDB, and a locally hosted Ollama model.”
2. **Create a reading:** Choose Horoscope to avoid image-upload time, or Palm reading with a safe sample image.
3. **Explain the workflow:** Frontend form → API client → REST controller → validation and service layer → Ollama → MongoDB → report UI.
4. **Show persistence:** Refresh recent readings, open the saved report, and show that the record has an ID and timestamp.
5. **Show lifecycle:** Export the report and delete a sample record.
6. **Show observability:** Open `/api/ai/status` and explain the configured model and connectivity fields.
7. **Show honest AI provenance:** Point to the saved report's `mode`. Only call it model-generated when the mode is `OLLAMA_LOCAL_LLM`; fallback modes are explicitly labeled.
8. **Explain limits:** Sun sign is date-based Western astrology only; this is not a calculated Vedic Kundli. Model output is reflective cultural/entertainment content, not validated prediction.

## Suggested technical explanation

- The code is separated into controller, DTO, service, repository, model, and exception packages.
- MongoDB stores flexible report documents; image payloads are omitted from history responses.
- The frontend API layer centralizes request/response handling and shared TypeScript types are separated from the page.
- Ollama is accessed through an adapter service, making the provider configurable without changing the frontend API.
- Nginx has a longer proxy read timeout to accommodate local inference latency.

## Do not claim

- That the app computes a full Vedic Kundli or astronomical planetary positions.
- That every report necessarily uses an LLM; verify the returned `mode` first.
- That palmistry/face reading or horoscope predictions are scientifically validated.
- That the demo is production-ready; authentication and several production hardening controls are not included.
