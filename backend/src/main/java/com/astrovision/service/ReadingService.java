package com.astrovision.service;

import java.time.Instant;
import com.astrovision.dto.CreateReadingRequest;
import com.astrovision.exception.ReadingNotFoundException;
import com.astrovision.model.Reading;
import com.astrovision.repository.ReadingRepository;
import java.time.LocalDate;
import java.time.MonthDay;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ReadingService {
    private final ReadingRepository repository;
    private final AiAnalysisService aiAnalysisService;
    @Value("${AI_MODE:ollama}") private String configuredMode;

    public ReadingService(ReadingRepository repository, AiAnalysisService aiAnalysisService) { this.repository = repository; this.aiAnalysisService = aiAnalysisService; }

    public Reading create(CreateReadingRequest request) {
        validateImage(request);
        boolean detailsRequired = request.readingType().equals("HOROSCOPE") || request.readingType().equals("COMBINED");
        if (detailsRequired && (request.name() == null || request.name().isBlank())) throw new IllegalArgumentException("Name is required for horoscope and combined readings.");
        if (detailsRequired && (request.birthDate() == null || request.birthDate().isBlank())) throw new IllegalArgumentException("Birth date is required for horoscope and combined readings.");
        String displayName = StringUtils.hasText(request.name()) ? request.name().trim() : "Guest";
        Reading r = new Reading();
        r.setName(displayName);
        r.setReadingType(request.readingType());
        r.setBirthDate(detailsRequired ? blankToNull(request.birthDate()) : null);
        r.setBirthTime(detailsRequired ? blankToNull(request.birthTime()) : null);
        r.setBirthPlace(detailsRequired ? blankToNull(request.birthPlace()) : null);
        r.setImageName(blankToNull(request.imageName()));
        r.setImageMimeType(blankToNull(request.imageMimeType()));
        r.setImageData(blankToNull(request.imageData()));
        r.setZodiacSign(detailsRequired ? zodiac(request.birthDate()) : "Not provided");
        r.setTitle(titleFor(request.readingType(), r.getZodiacSign()));
        String deterministicSummary = summaryFor(request.readingType(), r.getZodiacSign());
        String aiText = aiAnalysisService.analyze(displayName, request.readingType(), detailsRequired ? request.birthDate() : null, detailsRequired ? request.birthPlace() : null, request.imageData());
        r.setSummary(aiText == null ? deterministicSummary : aiText);
        r.setInsights(insightsFor(request.readingType(), r.getZodiacSign()));
        r.setRecommendations(List.of(
            "Treat this reading as a reflection prompt, not a guaranteed prediction.",
            "Use practical evidence and your own judgment for important decisions.",
            "Try a short journal entry to compare these themes with your own experience."
        ));
        r.setMode(aiText != null ? "OLLAMA_LOCAL_LLM" : ("ollama".equalsIgnoreCase(configuredMode) ? "DETERMINISTIC_FALLBACK_MODEL_UNAVAILABLE" : "DETERMINISTIC_DEMO"));
        r.setCreatedAt(Instant.now());
        return repository.save(r);
    }

    public List<Reading> recent() { return repository.findTop25ByOrderByCreatedAtDesc().stream().map(this::withoutImage).toList(); }
    public Reading get(String id) { return repository.findById(id).map(this::withoutImage).orElseThrow(() -> new ReadingNotFoundException(id)); }
    public void delete(String id) {
        if (!repository.existsById(id)) throw new ReadingNotFoundException(id);
        repository.deleteById(id);
    }

    private Reading withoutImage(Reading r) {
        r.setImageData(null);
        return r;
    }
    private String blankToNull(String s) { return s == null || s.isBlank() ? null : s; }

    private void validateImage(CreateReadingRequest r) {
        boolean imageRequired = r.readingType().equals("PALM") || r.readingType().equals("FACE") || r.readingType().equals("COMBINED");
        if (imageRequired && (r.imageData() == null || r.imageData().isBlank())) throw new IllegalArgumentException("Please upload an image for this reading type.");
        if (r.imageData() != null && !r.imageData().isBlank()) {
            if (!StringUtils.hasText(r.imageMimeType()) || !(r.imageMimeType().equals("image/jpeg") || r.imageMimeType().equals("image/png") || r.imageMimeType().equals("image/webp"))) throw new IllegalArgumentException("Image must be JPG, PNG, or WEBP.");
            try {
                byte[] decoded = Base64.getDecoder().decode(r.imageData());
                if (decoded.length > 5 * 1024 * 1024) throw new IllegalArgumentException("Image must be 5 MB or smaller.");
                if (decoded.length == 0) throw new IllegalArgumentException("Uploaded image is empty.");
            } catch (IllegalArgumentException ex) { throw new IllegalArgumentException("Invalid image data or image exceeds 5 MB."); }
        }
        if (r.birthDate() != null && !r.birthDate().isBlank()) {
            try { LocalDate.parse(r.birthDate()); } catch (DateTimeParseException ex) { throw new IllegalArgumentException("Birth date must use YYYY-MM-DD format."); }
        }
    }

    static String zodiac(String date) {
        if (date == null || date.isBlank()) return "Not provided";
        try {
            MonthDay md = MonthDay.from(LocalDate.parse(date));
            int m = md.getMonthValue(), d = md.getDayOfMonth();
            if ((m == 3 && d >= 21) || (m == 4 && d <= 19)) return "Aries";
            if ((m == 4 && d >= 20) || (m == 5 && d <= 20)) return "Taurus";
            if ((m == 5 && d >= 21) || (m == 6 && d <= 20)) return "Gemini";
            if ((m == 6 && d >= 21) || (m == 7 && d <= 22)) return "Cancer";
            if ((m == 7 && d >= 23) || (m == 8 && d <= 22)) return "Leo";
            if ((m == 8 && d >= 23) || (m == 9 && d <= 22)) return "Virgo";
            if ((m == 9 && d >= 23) || (m == 10 && d <= 22)) return "Libra";
            if ((m == 10 && d >= 23) || (m == 11 && d <= 21)) return "Scorpio";
            if ((m == 11 && d >= 22) || (m == 12 && d <= 21)) return "Sagittarius";
            if ((m == 12 && d >= 22) || (m == 1 && d <= 19)) return "Capricorn";
            if ((m == 1 && d >= 20) || (m == 2 && d <= 18)) return "Aquarius";
            return "Pisces";
        } catch (DateTimeParseException ex) { return "Not provided"; }
    }

    private String titleFor(String type, String sign) {
        return switch (type) {
            case "PALM" -> "Your palmistry reflection";
            case "FACE" -> "Your face-reading reflection";
            case "HOROSCOPE" -> "Your horoscope reflection";
            default -> "Your AstroVision reflection";
        };
    }
    private String summaryFor(String type, String sign) {
        String signText = sign.equals("Not provided") ? "With no birth date supplied, this report focuses on general reflection themes." : "Your sun-sign reference is " + sign + ". This is a broad Western sun-sign label, not a complete Vedic kundli.";
        String focus = switch (type) {
            case "PALM" -> "Traditional palmistry uses hand lines as symbolic prompts. This demo does not perform computer-vision detection of palm lines.";
            case "FACE" -> "Traditional face reading is a cultural practice and cannot reliably determine personality or destiny from appearance. This demo does not infer personal traits from facial features.";
            case "HOROSCOPE" -> "This is a general sun-sign reflection, not a calculated planetary chart or guaranteed forecast.";
            default -> "This combines a general sun-sign reference with reflective prompts. Image-based interpretation is not performed by the local demo engine.";
        };
        return signText + " " + focus;
    }
    private List<Reading.Insight> insightsFor(String type, String sign) {
        List<Reading.Insight> list = new ArrayList<>();
        list.add(new Reading.Insight("Reflection", "Notice your patterns", "Consider one recent decision that felt aligned with your values. What helped you make it?", "Not applicable"));
        list.add(new Reading.Insight("Growth", "Choose one small next step", "Pick a realistic action you can complete this week, then review what you learned.", "Not applicable"));
        list.add(new Reading.Insight("Relationships", "Practice clear communication", "Ask a thoughtful question and listen without rushing to a conclusion.", "Not applicable"));
        if (type.equals("HOROSCOPE") || type.equals("COMBINED")) list.add(new Reading.Insight("Sun sign", sign.equals("Not provided") ? "Birth date not supplied" : sign, "A broad sun-sign label based on the birth date. It is not a Vedic moon sign, ascendant, or full kundli.", "Calculated from date only"));
        if (type.equals("PALM")) list.add(new Reading.Insight("Palm image", "Image received", "The image is stored with this reading, but this offline demo does not detect or classify palm lines.", "Not analyzed"));
        if (type.equals("FACE")) list.add(new Reading.Insight("Face image", "Image received", "The image is stored with this reading, but this offline demo does not infer character or destiny from facial appearance.", "Not analyzed"));
        if (type.equals("COMBINED")) list.add(new Reading.Insight("Image analysis", "Vision model not enabled", "Enable and test a vision-capable model integration before claiming image understanding.", "Not analyzed"));
        return list;
    }
}
