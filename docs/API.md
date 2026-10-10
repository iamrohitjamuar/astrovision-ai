# REST API Reference

Base URL: `http://localhost:8080`

## Health

`GET /api/health`

Returns basic backend status.

## Ollama status

`GET /api/ai/status`

Returns `mode`, `provider`, `baseUrl`, `configuredModel`, `reachable`, `modelAvailable`, and a diagnostic message. A successful status check confirms reachability and model presence; it does not guarantee that every inference request will succeed.

## Create reading

`POST /api/readings` — `Content-Type: application/json`

Example horoscope payload:

```json
{
  "name": "Demo User",
  "readingType": "HOROSCOPE",
  "birthDate": "1996-08-14",
  "birthTime": "08:30",
  "birthPlace": "Mumbai, India"
}
```

Allowed reading types: `PALM`, `FACE`, `HOROSCOPE`, `COMBINED`. Name and reading type are required. Palm, face, and combined readings require an image. For an image, send `imageName`, `imageMimeType`, and `imageData` (Base64 data only; omit the `data:` prefix). Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`; decoded size limit: 5 MB.

A successful create returns the saved reading, including its `id`, `summary`, `insights`, `recommendations`, `mode`, and `createdAt`. Check `mode` to distinguish Ollama-generated output from deterministic fallback.

## List recent readings

`GET /api/readings`

Returns up to 25 newest reports. Image data is omitted.

## Get reading

`GET /api/readings/{id}`

Returns a saved report without its image payload. A missing ID returns HTTP 404.

## Delete reading

`DELETE /api/readings/{id}`

Deletes the saved report. Successful deletion returns HTTP 204.

## Error responses

Validation and request errors return HTTP 400 with a JSON `error` message. Missing readings return HTTP 404. Infrastructure failures may return framework/proxy errors; inspect backend and frontend logs for details.
