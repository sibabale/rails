package com.rails.users.security;

import com.rails.users.model.Environment;

import java.util.UUID;

public record RequestContext(UUID organizationId, Environment environment, UUID userId, String principalType) {
}
