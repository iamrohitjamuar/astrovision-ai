# Architecture Notes

## System context

AstroVision AI is a local-first full-stack demonstration. A browser client calls a Spring Boot REST API through the `/api` reverse-proxy path. The backend persists reports in MongoDB and delegates optional text/vision interpretation to an Ollama model running on the developer's host.

## Components

- **Frontend:** React, TypeScript, Vite, and Lucide icons. `pages/InsightStudio.tsx` owns the user workflow; `services/api.ts` encapsulates HTTP calls; `types/reading.ts` defines API-facing types.
- **REST API:** `controller/ReadingController` exposes health, AI status, and reading lifecycle endpoints.
- **DTO:** `dto/CreateReadingRequest` validates the incoming reading type and required name.
- **Application service:** `service/ReadingService` validates image metadata and payload size, computes a date-based sun sign, calls the AI adapter, builds fallback report content, and persists the reading.
- **AI adapter:** `service/AiAnalysisService` calls Ollama `/api/generate` and checks `/api/tags` for health/model availability.
- **Persistence:** `repository/ReadingRepository` uses Spring Data MongoDB; `model/Reading` represents the `readings` collection.
- **Error handling:** `exception/ApiExceptionHandler` maps validation and domain exceptions to HTTP responses.
- **Reverse proxy:** Nginx serves the built SPA and forwards `/api/*` requests to the backend. Its proxy read timeout is increased for local model inference.

## Request lifecycle

1. The user selects a reading type and enters details or uploads an image.
2. The frontend validates basic inputs and sends JSON to `POST /api/readings`.
3. Spring validates the request and the service validates image type, Base64 payload, size, and date format.
4. The service calls Ollama when `AI_MODE=ollama`.
5. Non-empty model output is saved with mode `OLLAMA_LOCAL_LLM`. If inference fails, the demo stores deterministic text with an explicit fallback mode.
6. MongoDB persists the report. List/get responses omit image payloads; delete removes the report document.

## Architectural boundaries

The LLM is an interpretation component, not a source of verified astronomical calculations or an authority for consequential decisions. The application currently calculates only a broad Western sun-sign label from date of birth. It does not calculate planetary positions, ascendant, Moon sign, or a full Vedic Kundli.

## Production hardening backlog

- Authentication, authorization, CSRF/CORS review, and secret management.
- Store images outside MongoDB; encrypt, expire, and delete them according to a retention policy.
- Typed model response schema, prompt-injection defenses, model-output validation, and content safety checks.
- Timeouts/retries/circuit breaking and request correlation IDs for Ollama calls.
- Integration and contract tests plus repeatable model evaluation.
- Rate limiting, metrics, traces, structured logs, and health/readiness separation.
- Versioned API contracts and CI pipeline for frontend build and backend tests.
