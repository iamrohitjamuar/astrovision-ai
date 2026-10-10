package com.astrovision.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

class ReadingServiceTest {
    @Test void mapsCommonSunSignsFromBirthDate() {
        assertEquals("Leo", ReadingService.zodiac("1996-08-14"));
        assertEquals("Aries", ReadingService.zodiac("2000-03-25"));
        assertEquals("Capricorn", ReadingService.zodiac("1991-01-02"));
        assertEquals("Not provided", ReadingService.zodiac(""));
    }
}
