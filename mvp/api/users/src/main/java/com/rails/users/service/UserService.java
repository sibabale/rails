package com.rails.users.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.rails.users.model.Environment;
import com.rails.users.model.OutboxEvent;
import com.rails.users.model.User;
import com.rails.users.model.UserRole;
import com.rails.users.model.UserStatus;
import com.rails.users.repository.OutboxEventRepository;
import com.rails.users.repository.UserRepository;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(
        UserService.class
    );

    private final UserRepository userRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final OrganizationalHierarchyService organizationalHierarchyService;
    private final ObjectMapper objectMapper;
    private final String userCreatedBaseSubject;

    public UserService(
        UserRepository userRepository,
        OutboxEventRepository outboxEventRepository,
        OrganizationalHierarchyService organizationalHierarchyService,
        ObjectMapper objectMapper,
        @Value(
            "${rails.nats.subjects.userCreated}"
        ) String userCreatedBaseSubject
    ) {
        this.userRepository = userRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.organizationalHierarchyService = organizationalHierarchyService;
        this.objectMapper = objectMapper;
        this.userCreatedBaseSubject = userCreatedBaseSubject;
    }

    /**
     * Creates a user with smart role assignment based on organizational rules:
     * - First user in org/env gets ADMIN role automatically
     * - Subsequent users get CUSTOMER role and must specify adminUserId
     * - Explicitly requested ADMIN creates secondary admin
     */
    @Transactional(
        isolation = Isolation.SERIALIZABLE,
        propagation = Propagation.REQUIRED
    )
    public User createUser(
        UUID organizationId,
        Environment environment,
        String name,
        String email,
        String phone,
        UserRole requestedRole,
        Map<String, Object> metadata
    ) {
        return createUserWithAdminAssignment(
            organizationId,
            environment,
            name,
            email,
            phone,
            requestedRole,
            null,
            metadata
        );
    }

    /**
     * Creates a customer user with explicit admin assignment
     */
    @Transactional(
        isolation = Isolation.SERIALIZABLE,
        propagation = Propagation.REQUIRED
    )
    public User createCustomerUser(
        UUID organizationId,
        Environment environment,
        String name,
        String email,
        String phone,
        UUID adminUserId,
        Map<String, Object> metadata
    ) {
        return createUserWithAdminAssignment(
            organizationId,
            environment,
            name,
            email,
            phone,
            UserRole.CUSTOMER,
            adminUserId,
            metadata
        );
    }

    /**
     * Core user creation method with organizational hierarchy logic
     */
    @Transactional(
        isolation = Isolation.SERIALIZABLE,
        propagation = Propagation.REQUIRED
    )
    public User createUserWithAdminAssignment(
        UUID organizationId,
        Environment environment,
        String name,
        String email,
        String phone,
        UserRole requestedRole,
        UUID adminUserId,
        Map<String, Object> metadata
    ) {
        logger.info(
            "Creating user with role {} for organization {} in environment {}",
            requestedRole,
            organizationId,
            environment
        );

        // Check if email already exists in organization
        Optional<User> existingUser =
            userRepository.findByEmailAndOrganizationAndEnvironment(
                email,
                organizationId,
                environment
            );
        if (existingUser.isPresent()) {
            throw new IllegalArgumentException(
                "User with email " + email + " already exists in organization"
            );
        }

        // Smart role assignment logic
        UserRole finalRole = determineUserRole(
            organizationId,
            environment,
            requestedRole
        );
        UUID finalAdminUserId = determineAdminUserId(
            organizationId,
            environment,
            finalRole,
            adminUserId
        );

        User user;

        if (finalRole == UserRole.ADMIN) {
            // Use organizational hierarchy service for admin creation
            user = organizationalHierarchyService.createAdminUser(
                organizationId,
                environment,
                name,
                email,
                phone,
                writeJson(metadata)
            );
        } else if (finalRole == UserRole.CUSTOMER) {
            // Use organizational hierarchy service for customer creation
            if (finalAdminUserId == null) {
                throw new IllegalArgumentException(
                    "Customer users must be associated with an admin"
                );
            }
            user = organizationalHierarchyService.createCustomerUser(
                organizationId,
                environment,
                name,
                email,
                phone,
                finalAdminUserId,
                writeJson(metadata)
            );
        } else {
            // Handle SERVICE role (direct creation)
            user = createServiceUser(
                organizationId,
                environment,
                name,
                email,
                phone,
                metadata
            );
        }

        // Publish user creation event
        publishUserCreatedEvent(user);

        logger.info(
            "Created user {} with role {} in organization {}",
            user.getId(),
            user.getRole(),
            organizationId
        );

        return user;
    }

    /**
     * Determines the appropriate role based on organizational state and request
     */
    private UserRole determineUserRole(
        UUID organizationId,
        Environment environment,
        UserRole requestedRole
    ) {
        // Check if this is the first user in the organization
        Optional<User> primaryAdmin =
            userRepository.findPrimaryAdminByOrganization(
                organizationId,
                environment
            );

        if (primaryAdmin.isEmpty()) {
            // First user in organization becomes primary admin regardless of request
            logger.info(
                "No existing admin in organization {}/{}, assigning ADMIN role",
                organizationId,
                environment
            );
            return UserRole.ADMIN;
        }

        // If admin already exists, honor the requested role
        if (requestedRole == UserRole.ADMIN) {
            logger.info(
                "Creating secondary admin for organization {}/{}",
                organizationId,
                environment
            );
        }

        return requestedRole != null ? requestedRole : UserRole.CUSTOMER;
    }

    /**
     * Determines admin assignment for customer users
     */
    private UUID determineAdminUserId(
        UUID organizationId,
        Environment environment,
        UserRole role,
        UUID explicitAdminId
    ) {
        if (role != UserRole.CUSTOMER) {
            return null; // Non-customers don't need admin assignment
        }

        if (explicitAdminId != null) {
            return explicitAdminId;
        }

        // Auto-assign to primary admin if no explicit assignment
        Optional<User> primaryAdmin =
            userRepository.findPrimaryAdminByOrganization(
                organizationId,
                environment
            );
        if (primaryAdmin.isPresent()) {
            logger.info(
                "Auto-assigning customer to primary admin {} in organization {}",
                primaryAdmin.get().getId(),
                organizationId
            );
            return primaryAdmin.get().getId();
        }

        return null;
    }

    /**
     * Creates a service user (system/API user)
     */
    private User createServiceUser(
        UUID organizationId,
        Environment environment,
        String name,
        String email,
        String phone,
        Map<String, Object> metadata
    ) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setOrganizationId(organizationId);
        user.setEnvironment(environment);
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(UserRole.SERVICE);
        user.setStatus(UserStatus.ACTIVE);
        user.setAdminUserId(null);
        user.setMetadata(writeJson(metadata));
        user.setCreatedAt(Instant.now());

        // Set service organizational context
        ObjectNode orgContext = objectMapper.createObjectNode();
        orgContext.put("service_type", "api");
        orgContext.put("hierarchy_level", -1);
        orgContext.put("created_via", "api");
        orgContext.put("service_privileges", true);

        user.setOrganizationalContext(orgContext.toString());

        return userRepository.save(user);
    }

    /**
     * Publishes user creation event to NATS
     */
    private void publishUserCreatedEvent(User user) {
        OutboxEvent event = new OutboxEvent();
        event.setId(UUID.randomUUID());
        event.setOrganizationId(user.getOrganizationId());
        event.setEnvironment(user.getEnvironment());
        event.setEventType("user.created");

        String envPart = user.getEnvironment().name().toLowerCase();
        String subject =
            userCreatedBaseSubject +
            "." +
            envPart +
            "." +
            user.getOrganizationId();
        event.setSubject(subject);

        event.setPayload(
            writeJson(
                Map.of(
                    "event_type",
                    "user.created",
                    "organization_id",
                    user.getOrganizationId().toString(),
                    "environment",
                    envPart,
                    "user_id",
                    user.getId().toString(),
                    "role",
                    user.getRole().toString(),
                    "admin_user_id",
                    user.getAdminUserId() != null
                        ? user.getAdminUserId().toString()
                        : null,
                    "email",
                    user.getEmail(),
                    "name",
                    user.getName()
                )
            )
        );

        event.setCreatedAt(Instant.now());
        outboxEventRepository.save(event);
    }

    private String writeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid JSON payload", e);
        }
    }
}
