package com.rails.users.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rails.users.model.Environment;
import com.rails.users.model.User;
import com.rails.users.model.UserRole;
import com.rails.users.security.EnvironmentAndIdempotencyFilter;
import com.rails.users.security.RequestContextHolder;
import com.rails.users.service.IdempotencyService;
import com.rails.users.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    private final UserService userService;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    public UserController(
        UserService userService,
        IdempotencyService idempotencyService,
        ObjectMapper objectMapper
    ) {
        this.userService = userService;
        this.idempotencyService = idempotencyService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(
        @RequestBody CreateUserRequest body,
        HttpServletRequest request
    ) {
        Environment env = RequestContextHolder.getRequired().environment();

        String idempotencyKey = (String) request.getAttribute(
            EnvironmentAndIdempotencyFilter.HEADER_IDEMPOTENCY_KEY
        );
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException(
                "Idempotency-Key header is required"
            );
        }

        String method = request.getMethod();
        String path = request.getRequestURI();

        return idempotencyService
            .getCachedResponse(
                idempotencyKey,
                method,
                path,
                env,
                body.organizationId
            )
            .map(cached ->
                ResponseEntity.status(cached.status()).body(
                    readJson(cached.jsonBody())
                )
            )
            .orElseGet(() -> {
                idempotencyService.recordInProgress(
                    idempotencyKey,
                    method,
                    path,
                    env,
                    body.organizationId,
                    body
                );

                User user;
                if (body.adminUserId != null) {
                    // Create customer with explicit admin assignment
                    user = userService.createCustomerUser(
                        body.organizationId,
                        env,
                        body.name,
                        body.email,
                        body.phone,
                        body.adminUserId,
                        body.metadata
                    );
                } else {
                    // Use smart role assignment (first user becomes admin, others become customers)
                    user = userService.createUser(
                        body.organizationId,
                        env,
                        body.name,
                        body.email,
                        body.phone,
                        body.role,
                        body.metadata
                    );
                }

                CreateUserResponse resp = new CreateUserResponse(
                    user.getId(),
                    user.getOrganizationId(),
                    user.getEnvironment().name().toLowerCase(),
                    user.getName(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getRole().name(),
                    user.getStatus().name(),
                    user.getMetadata(),
                    user.getAdminUserId(),
                    user.getOrganizationalContext(),
                    user.getCreatedAt()
                );

                idempotencyService.recordResponse(
                    idempotencyKey,
                    method,
                    path,
                    env,
                    body.organizationId,
                    HttpStatus.CREATED,
                    resp
                );
                return ResponseEntity.status(HttpStatus.CREATED).body(resp);
            });
    }

    private Object readJson(String json) {
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception e) {
            return Map.of("raw", json);
        }
    }

    public static final class CreateUserRequest {

        @NotNull
        public UUID organizationId;

        @NotBlank
        public String name;

        @NotBlank
        @Email
        public String email;

        public String phone;

        public UserRole role;

        public UUID adminUserId;

        public Map<String, Object> metadata;
    }

    public record CreateUserResponse(
        UUID id,
        UUID organizationId,
        String environment,
        String name,
        String email,
        String phone,
        String role,
        String status,
        String metadata,
        UUID adminUserId,
        String organizationalContext,
        java.time.Instant createdAt
    ) {}
}
