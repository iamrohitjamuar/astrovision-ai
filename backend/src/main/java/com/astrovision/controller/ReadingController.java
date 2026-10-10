package com.astrovision.controller;

import com.astrovision.dto.CreateReadingRequest;
import com.astrovision.model.Reading;
import com.astrovision.service.AiAnalysisService;
import com.astrovision.service.ReadingService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ReadingController {
    private final ReadingService service;
    private final AiAnalysisService aiAnalysisService;
    public ReadingController(ReadingService service, AiAnalysisService aiAnalysisService) { this.service = service; this.aiAnalysisService = aiAnalysisService; }

    @GetMapping("/health")
    public Map<String, Object> health() { return Map.of("status", "UP", "service", "astrovision-api", "database", "MongoDB configured"); }

    @GetMapping("/ai/status")
    public Map<String, Object> aiStatus() { return aiAnalysisService.status(); }

    @PostMapping("/readings")
    @ResponseStatus(HttpStatus.CREATED)
    public Reading create(@Valid @RequestBody CreateReadingRequest request) { return service.create(request); }

    @GetMapping("/readings")
    public List<Reading> list() { return service.recent(); }

    @GetMapping("/readings/{id}")
    public Reading get(@PathVariable String id) { return service.get(id); }

    @DeleteMapping("/readings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) { service.delete(id); }
}
