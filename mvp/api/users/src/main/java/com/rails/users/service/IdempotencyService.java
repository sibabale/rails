package com.rails.users.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rails.users.model.Environment;
import com.rails.users.model.IdempotencyKey;
import com.rails.users.repository.IdempotencyKeyRepository;
import com.rails.users.util.Hashing;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class IdempotencyService {

    private final IdempotencyKeyRepository repository;
    private final ObjectMapper objectMapper;

    public IdempotencyService(IdempotencyKeyRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Optional<CachedResponse> getCachedResponse(String idempotencyKey,
                                                     String method,
                                                     String path,
                                                     Environment env,
                                                     UUID organizationId) {
        return repository
                .findByIdempotencyKeyAndRequestMethodAndRequestPathAndEnvironmentAndOrganizationId(idempotencyKey, method, path, env, organizationId)
                .filter(r -> r.getResponseStatus() != null && r.getResponseBody() != null)
                .map(r -> new CachedResponse(r.getResponseStatus(), r.getResponseBody()));
    }

    @Transactional
    public void recordInProgress(String idempotencyKey,
                                 String method,
                                 String path,
                                 Environment env,
                                 UUID organizationId,
                                 Object requestBody) {
        String requestHash = Hashing.sha256Hex(writeJson(requestBody));

        IdempotencyKey row = new IdempotencyKey();
        row.setId(UUID.randomUUID());
        row.setIdempotencyKey(idempotencyKey);
        row.setRequestMethod(method);
        row.setRequestPath(path);
        row.setEnvironment(env);
        row.setOrganizationId(organizationId);
        row.setRequestHash(requestHash);
        row.setCreatedAt(Instant.now());

        try {
            repository.save(row);
        } catch (DataIntegrityViolationException ignored) {
        }
    }

    @Transactional
    public void recordResponse(String idempotencyKey,
                               String method,
                               String path,
                               Environment env,
                               UUID organizationId,
                               HttpStatus status,
                               Object responseBody) {
        IdempotencyKey row = repository
                .findByIdempotencyKeyAndRequestMethodAndRequestPathAndEnvironmentAndOrganizationId(idempotencyKey, method, path, env, organizationId)
                .orElseThrow(() -> new IllegalStateException("Idempotency row missing"));

        row.setResponseStatus(status.value());
        row.setResponseBody(writeJson(responseBody));
        repository.save(row);
    }

    private String writeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize JSON", e);
        }
    }

    public record CachedResponse(int status, String jsonBody) {
    }
}
