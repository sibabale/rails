package com.rails.users.repository;

import com.rails.users.model.Environment;
import com.rails.users.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByIdAndOrganizationIdAndEnvironment(UUID id, UUID organizationId, Environment environment);
}
