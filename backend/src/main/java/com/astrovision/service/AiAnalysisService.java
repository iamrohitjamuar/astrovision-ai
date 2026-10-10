package com.astrovision.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/** Calls the local Ollama HTTP API. If unavailable, callers can explicitly label the deterministic fallback. */
@Service
public class AiAnalysisService {
    @Value("${AI_MODE:ollama}") private String mode;
    @Value("${OLLAMA_BASE_URL:http://localhost:11434}") private String baseUrl;
    @Value("${OLLAMA_MODEL:qwen2.5vl:3b}") private String model;

    public String analyze(String name, String type, String birthDate, String birthPlace, String imageData) {
        if (!"ollama".equalsIgnoreCase(mode)) return null;
        try {
            String prompt = "You are AstroVision, a cautious cultural reflection assistant. Create a concise, kind report for reading type " + type + ". Name: " + safe(name) + ". Birth date: " + safe(birthDate) + ". Birth place: " + safe(birthPlace) + ". " +
                "For HOROSCOPE, offer general reflective themes only; do not claim a calculated Vedic kundli or astronomical chart. " +
                "For PALM, you may describe visible palm lines if they are clearly visible and frame any meaning strictly as traditional palmistry symbolism, not science. " +
                "For FACE, describe only visible, non-sensitive image details and image quality; do not infer personality, health, protected traits, or destiny from facial appearance. " +
                "For any attached image, do not claim details that are not clearly visible. Return sections titled Observations, Reflective themes, and Practical prompts. State uncertainty. " +
                "This is cultural/entertainment content, not scientific assessment or guaranteed prediction. Do not give medical, legal, financial, or safety-critical advice.";
            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("prompt", prompt);
            body.put("stream", false);
            if (imageData != null && !imageData.isBlank()) body.put("images", List.of(imageData));
            Map<?, ?> response = RestClient.create().post().uri(trimSlash(baseUrl) + "/api/generate").body(body).retrieve().body(Map.class);
            Object value = response == null ? null : response.get("response");
            if (value instanceof String text && !text.isBlank()) return text.trim();
        } catch (Exception ex) {
            // Do not break the demo if Ollama is stopped; ReadingService records the fallback mode.
            return null;
        }
        return null;
    }

    public Map<String, Object> status() {
        Map<String, Object> result = new HashMap<>();
        result.put("mode", mode);
        result.put("provider", "Ollama local HTTP API");
        result.put("baseUrl", baseUrl);
        result.put("configuredModel", model);
        if (!"ollama".equalsIgnoreCase(mode)) {
            result.put("reachable", false);
            result.put("message", "AI_MODE is local-demo; no LLM request will be made.");
            return result;
        }
        try {
            Map<?, ?> tags = RestClient.create().get().uri(trimSlash(baseUrl) + "/api/tags").retrieve().body(Map.class);
            Object modelsObject = tags == null ? null : tags.get("models");
            boolean found = false;
            if (modelsObject instanceof List<?> models) {
                for (Object item : models) {
                    if (item instanceof Map<?, ?> modelEntry) {
                        Object name = modelEntry.get("name");
                        if (name != null && (name.toString().equals(model) || name.toString().startsWith(model + ":") || model.startsWith(name.toString() + ":"))) {
                            found = true;
                            break;
                        }
                    }
                }
            }
            result.put("reachable", true);
            result.put("modelAvailable", found);
            result.put("message", found ? "Ollama is reachable and the configured model is installed." : "Ollama is reachable, but the configured model was not found. Pull it before generating a reading.");
        } catch (Exception ex) {
            result.put("reachable", false);
            result.put("modelAvailable", false);
            result.put("message", "Cannot reach Ollama. Start Ollama and verify OLLAMA_BASE_URL.");
        }
        return result;
    }

    private String safe(String value) { return value == null || value.isBlank() ? "not supplied" : value; }
    private String trimSlash(String value) { return value.endsWith("/") ? value.substring(0, value.length() - 1) : value; }
}
