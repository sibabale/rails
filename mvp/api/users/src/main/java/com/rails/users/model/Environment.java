package com.rails.users.model;

public enum Environment {
    SANDBOX,
    PRODUCTION;

    public static Environment fromHeader(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("X-Rails-Env header is required");
        }
        return switch (value.trim().toLowerCase()) {
            case "sandbox" -> SANDBOX;
            case "production" -> PRODUCTION;
            default -> throw new IllegalArgumentException("Invalid X-Rails-Env header: " + value);
        };
    }
}
