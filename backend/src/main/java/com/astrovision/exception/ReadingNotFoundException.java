package com.astrovision.exception;

public class ReadingNotFoundException extends RuntimeException {
    public ReadingNotFoundException(String id) { super("Reading not found: " + id); }
}
