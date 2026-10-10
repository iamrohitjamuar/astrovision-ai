# AstroVision AI

A local-first, full-stack application for generating reflective palmistry, face-reading, horoscope, and combined reports. The project demonstrates a React/TypeScript client, a layered Spring Boot REST API, MongoDB persistence, and optional local inference through Ollama.

> **Scope and responsible use:** Astrology and palmistry are traditional belief systems, not scientifically validated ways to predict personality or future events. AI output is generated content and may be inaccurate. This demo does not calculate a full Vedic Kundli or astronomical planetary positions. Do not use it for medical, financial, legal, employment, or other consequential decisions.

## Highlights

- React 18 + TypeScript + Vite frontend with a responsive dashboard.
- Java 17 + Spring Boot 3 REST API.
- MongoDB document persistence for reports and reading history.
- Local Ollama HTTP API integration; default model: `qwen2.5vl:3b`.
- Explicit AI status endpoint and report mode to distinguish Ollama output from deterministic fallback.
- Palm/face image upload validation (JPG, PNG, WEBP; maximum 5 MB).
- Create, list, retrieve, delete, and export reports.
- Docker Compose stack for the frontend, backend, and MongoDB.
- Nginx API proxy configured with a longer read timeout for local model inference.
- Basic unit test for date-based Western sun-sign boundaries.

## Reading input requirements

- **Palm reading:** palm image only; name and birth details are not shown or required.
- **Face reading:** face image only; name and birth details are not shown or required.
- **Horoscope:** name and date of birth are required; birth time and birth place are optional.
- **Combined reading:** name and date of birth are required; birth time and birth place are optional, along with an image.

For palm and face readings, the backend stores the report under a generic `Guest` label and does not persist birth details.

## Architecture

```text
Browser
  React + TypeScript + Vite (development) / Nginx (Docker)
                 |
                 | /api/*
                 v
        Spring Boot REST API (Java 17)
          |                   |
          |                   +------> Ollama HTTP API on host
          |                           /api/generate, /api/tags
          v
        MongoDB
        readings collection
```

The backend is organized by responsibility: controllers handle HTTP, DTOs define request contracts, services implement application logic, repositories access MongoDB, models represent persisted data, and exception handlers translate errors into API responses. The frontend separates the page, API client, and shared types.

## Prerequisites

Recommended local setup:

- macOS, Linux, or Windows with Docker Desktop / Docker Engine and Docker Compose v2.
- Ollama installed on the host machine for local LLM generation.
- The Ollama model `qwen2.5vl:3b` downloaded before the demo.
- Internet access for the first Docker build and model download.

Java 17 and Maven are required only if you want to run or test the backend directly outside Docker. The Docker backend image uses Java 17 regardless of the Java version installed on the host.

## Quick start (recommended)

### 1. Configure environment

From the repository root:

```bash
cp .env.example .env
```

The defaults target Ollama running on the same Mac through Docker Desktop's `host.docker.internal` host alias. You can keep the default values for a standard local setup.

### 2. Start Ollama on macOS

Install Ollama from the official Ollama app or using Homebrew:

```bash
brew install --cask ollama
ollama pull qwen2.5vl:3b
```

Start the server if it is not already running. If the desktop app owns the server, use that running service instead of starting a second one. For Docker-to-host access, the Ollama service must listen on an address Docker Desktop can reach. On a trusted development machine, one option is:

```bash
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Keep the terminal open. Do not expose port `11434` to the public internet or an untrusted network.

Verify the host API in another terminal:

```bash
curl http://localhost:11434/api/tags
```

Confirm `qwen2.5vl:3b` appears in the `models` list.

### 3. Build and start the application

From the project root (the directory containing `docker-compose.yml`):

```bash
docker compose up --build -d
```

Follow startup logs:

```bash
docker compose ps
docker compose logs -f backend frontend
```

### 4. Open the application

- Frontend: <http://localhost:5173>
- Backend health: <http://localhost:8080/api/health>
- Ollama connectivity: <http://localhost:8080/api/ai/status>
- Reading collection API: <http://localhost:8080/api/readings>

Expected AI status includes `"reachable": true` and `"modelAvailable": true`. Generate a reading and verify the returned `mode` is `OLLAMA_LOCAL_LLM` to confirm the request used Ollama. If the model is unavailable, this demo may return a deterministic fallback; do not describe fallback content as LLM output.

### 5. Stop the application

```bash
docker compose down
```

MongoDB data is persisted in the named Docker volume `astrovision-data`. To delete the saved demo database as well, run:

```bash
docker compose down -v
```

This permanently removes the named MongoDB volume data.

## Local development without Docker (optional)

### Backend

Requirements: Java 17, Maven 3.9+, MongoDB running on `localhost:27017`, and Ollama running on `localhost:11434`.

On macOS, make Maven use Java 17 if multiple JDKs are installed:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH="$JAVA_HOME/bin:$PATH"
java -version
mvn -version
```

Both commands should report Java 17. Then run:

```bash
cd backend
mvn test
mvn spring-boot:run
```

### Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite development server proxies `/api` requests to `http://localhost:8080`.

## Configuration

Configuration can be supplied in `.env` for Docker Compose or as environment variables for Spring Boot.

| Variable | Default | Purpose |
|---|---|---|
| `AI_MODE` | `ollama` | `ollama` enables local model calls; `local-demo` disables LLM calls and uses deterministic output. |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | Ollama base URL from the backend container. |
| `OLLAMA_MODEL` | `qwen2.5vl:3b` | Installed Ollama model name. |
| `SPRING_DATA_MONGODB_URI` | `mongodb://mongodb:27017/astrovision` in Compose | MongoDB connection URI. |
| `SERVER_PORT` | `8080` | Backend HTTP port. |

For macOS Docker Desktop, `host.docker.internal` resolves to the host machine. For other environments, adjust `OLLAMA_BASE_URL` to an address reachable from the backend container.

## REST API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Basic backend health response. |
| `GET` | `/api/ai/status` | Checks Ollama reachability and whether the configured model is installed. |
| `POST` | `/api/readings` | Creates a reading and persists the report. |
| `GET` | `/api/readings` | Lists the 25 most recent reports (without image payloads). |
| `GET` | `/api/readings/{id}` | Retrieves one report (without image payload). |
| `DELETE` | `/api/readings/{id}` | Deletes a report and its stored image. |

### Example: create a horoscope

```bash
curl -i -X POST http://localhost:8080/api/readings \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Demo User",
    "readingType": "HOROSCOPE",
    "birthDate": "1996-08-14",
    "birthTime": "08:30",
    "birthPlace": "Mumbai, India"
  }'
```

For `PALM`, `FACE`, and `COMBINED`, include `imageName`, `imageMimeType`, and `imageData` (raw Base64 without the `data:` URL prefix). Supported MIME types are `image/jpeg`, `image/png`, and `image/webp`. Maximum decoded image size is 5 MB.

### Verify Ollama generation

1. Call `GET /api/ai/status` and confirm `reachable` and `modelAvailable` are `true`.
2. Create a reading.
3. Check the response `mode`. `OLLAMA_LOCAL_LLM` means the service received non-empty text from Ollama. `DETERMINISTIC_FALLBACK_MODEL_UNAVAILABLE` means it used fallback content. `DETERMINISTIC_DEMO` means `AI_MODE=local-demo`.
4. Check backend logs if the report takes a long time. Model inference latency depends on available memory, CPU/GPU, image size, and model load state.

## Tests

Run backend unit tests with:

```bash
cd backend
mvn test
```

The included test covers common date-based Western sun-sign boundaries. Before production use, add service/repository integration tests, API contract tests, and automated evaluation of model outputs.

## Repository structure

```text
astrovision-ai/
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEMO_SCRIPT.md
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/astrovision/
│       │   ├── AstrovisionApplication.java
│       │   ├── controller/       # REST endpoints
│       │   ├── dto/              # Request contracts
│       │   ├── exception/        # API exception mapping
│       │   ├── model/            # MongoDB documents
│       │   ├── repository/       # Spring Data MongoDB
│       │   └── service/          # Business logic and Ollama adapter
│       ├── main/resources/application.properties
│       └── test/java/com/astrovision/service/
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── pages/                # Main application page
        ├── services/             # HTTP API client
        ├── types/                # Shared TypeScript types
        └── styles.css
```

## Design decisions and known limitations

- **Layered monolith:** one Spring Boot deployment keeps local setup simple while maintaining clear responsibilities.
- **MongoDB:** reading reports are document-shaped and include optional image metadata and report sections.
- **Local LLM:** the AI adapter calls Ollama's `/api/generate` endpoint. The vision-capable model can receive Base64 image content, but model output is not guaranteed to be correct.
- **Fallback:** when Ollama fails or returns no usable content, the service falls back to deterministic report text and records the mode. Verify the mode before presenting a report as AI-generated.
- **Astrology scope:** the application calculates a broad Western sun sign from date only. It does not calculate a Vedic Moon sign, ascendant, ephemeris, or full Kundli. Birth time and place are collected but are not used for astronomical calculations.
- **Image storage:** for this small demo, Base64 image data is stored in MongoDB. A production design should move images to object storage and retain metadata/references in MongoDB.
- **Security:** this is a local demo without authentication or authorization. Do not expose it publicly or store sensitive personal images. Production use needs access controls, retention/deletion policies, transport security, rate limiting, model output validation, and observability.
- **AI quality:** generated content is advisory and should be presented as cultural/entertainment reflection, not scientific fact or a guaranteed prediction.

## Troubleshooting

### Frontend shows 504 Gateway Time-out

The local model may take longer than a normal API call. The Nginx configuration includes a 300-second `proxy_read_timeout` and related timeouts. Rebuild the frontend after configuration changes:

```bash
docker compose build --no-cache frontend
docker compose up -d
```

If it still times out, test Ollama directly and inspect logs:

```bash
time curl http://localhost:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"model":"qwen2.5vl:3b","prompt":"Write a short reflective paragraph.","stream":false}'
docker compose logs -f backend frontend
```

### AI status reports unreachable

- Verify `curl http://localhost:11434/api/tags` on the host.
- Confirm the model is installed: `ollama list`.
- Confirm `OLLAMA_BASE_URL` is reachable from the backend container.
- On macOS Docker Desktop, the default is `http://host.docker.internal:11434`.

### Backend or MongoDB is unavailable

```bash
docker compose ps
docker compose logs --tail=200 backend mongodb
```

### Build problems

Resolve the first Maven, npm, or Docker build error before investigating later cascading errors. Ensure the TypeScript compiler uses the repository's `frontend/tsconfig.json` and keep the existing JSX and module-resolution settings.
