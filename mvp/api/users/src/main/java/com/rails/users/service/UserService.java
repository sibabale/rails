package com.rails.users.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rails.users.model.Environment;
import com.rails.users.model.OutboxEvent;
import com.rails.users.model.User;
import com.rails.users.model.UserRole;
import com.rails.users.model.UserStatus;
import com.rails.users.repository.OutboxEventRepository;
import com.rails.users.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;
    private final String userCreatedBaseSubject;

    public UserService(UserRepository userRepository,
                       OutboxEventRepository outboxEventRepository,
                       ObjectMapper objectMapper,
                       @Value("${rails.nats.subjects.userCreated}") String userCreatedBaseSubject) {
        this.userRepository = userRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.objectMapper = objectMapper;
        this.userCreatedBaseSubject = userCreatedBaseSubject;
    }

    @Transactional
    public User createUser(UUID organizationId,
                           Environment environment,
                           String name,
                           String email,
                           String phone,
                           UserRole role,
                           Map<String, Object> metadata) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setOrganizationId(organizationId);
        user.setEnvironment(environment);
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(role == null ? UserRole.CUSTOMER : role);
        user.setStatus(UserStatus.ACTIVE);
        user.setMetadata(writeJson(metadata == null ? Map.of() : metadata));
        user.setCreatedAt(Instant.now());
        userRepository.save(user);

        OutboxEvent event = new OutboxEvent();
        event.setId(UUID.randomUUID());
        event.setOrganizationId(organizationId);
        event.setEnvironment(environment);
        event.setEventType("user.created");

        String envPart = environment.name().toLowerCase();
        String subject = userCreatedBaseSubject + "." + envPart + "." + organizationId;
        event.setSubject(subject);

        event.setPayload(writeJson(Map.of(
                "event_type", "user.created",
                "organization_id", organizationId.toString(),
                "environment", envPart,
                "user_id", user.getId().toString()
        )));

        event.setCreatedAt(Instant.now());
        outboxEventRepository.save(event);

        return user;
    }

    private String writeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid JSON payload", e);
        }
    }
}
