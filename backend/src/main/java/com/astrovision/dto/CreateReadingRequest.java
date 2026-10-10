package com.astrovision.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateReadingRequest(
    String name,
    @NotBlank(message = "Choose a reading type") @Pattern(regexp = "PALM|FACE|HOROSCOPE|COMBINED", message = "Unsupported reading type") String readingType,
    String birthDate,
    String birthTime,
    String birthPlace,
    String imageName,
    String imageMimeType,
    String imageData
) {}
