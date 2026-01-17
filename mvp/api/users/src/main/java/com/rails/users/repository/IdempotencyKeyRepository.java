package com.rails.users.repository;

import com.rails.users.model.Environment;
import com.rails.users.model.IdempotencyKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKey, UUID> {
    Optional<IdempotencyKey> findByIdempotencyKeyAndRequestMethodAndRequestPathAndEnvironmentAndOrganizationId(
            String idempotencyKey,
            String requestMethod,
            String requestPath,
            Environment environment,
            UUID organizationId
    );
}
