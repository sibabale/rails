package com.rails.users.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.rails.users.model.Environment;
import com.rails.users.model.User;
import com.rails.users.model.UserRole;
import com.rails.users.model.UserStatus;
import com.rails.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing organizational hierarchy with ACID transaction guarantees.
 * Implements business rules for admin-customer relationships and organizational integrity.
 */
@Service
public class OrganizationalHierarchyService {

    private static final Logger logger = LoggerFactory.getLogger(OrganizationalHierarchyService.class);

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public OrganizationalHierarchyService(UserRepository userRepository, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Creates an admin user with organizational context.
     * Admins are created without admin_user_id (null) as they are top-level.
     */
    @Transactional(isolation = Isolation.SERIALIZABLE, propagation = Propagation.REQUIRED)
    public User createAdminUser(UUID organizationId, Environment environment, String name,
                               String email, String phone, String metadata) {

        logger.info("Creating admin user for organization {} in environment {}",
                   organizationId, environment);

        // Check if organization already has a primary admin
        Optional<User> existingPrimaryAdmin = userRepository.findPrimaryAdminByOrganization(
            organizationId, environment);

        boolean isPrimaryAdmin = existingPrimaryAdmin.isEmpty();

        User admin = new User();
        admin.setId(UUID.randomUUID());
        admin.setOrganizationId(organizationId);
        admin.setEnvironment(environment);
        admin.setName(name);
        admin.setEmail(email);
        admin.setPhone(phone);
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setAdminUserId(null); // Admins don't have an admin
        admin.setMetadata(metadata);
        admin.setCreatedAt(Instant.now());

        // Set organizational context
        ObjectNode orgContext = objectMapper.createObjectNode();
        orgContext.put("is_primary_admin", isPrimaryAdmin);
        orgContext.put("customer_count", 0);
        orgContext.put("hierarchy_level", 0);
        orgContext.put("created_via", "api");
        orgContext.put("admin_privileges", true);

        admin.setOrganizationalContext(orgContext.toString());

        User savedAdmin = userRepository.save(admin);

        logger.info("Created {} admin user {} for organization {}",
                   isPrimaryAdmin ? "primary" : "secondary",
                   savedAdmin.getId(), organizationId);

        return savedAdmin;
    }

    /**
     * Creates a customer user associated with an admin.
     * Implements ACID principles to ensure referential integrity.
     */
    @Transactional(isolation = Isolation.SERIALIZABLE, propagation = Propagation.REQUIRED)
    public User createCustomerUser(UUID organizationId, Environment environment, String name,
                                  String email, String phone, UUID adminUserId, String metadata) {

        logger.info("Creating customer user for admin {} in organization {}",
                   adminUserId, organizationId);

        // Validate admin exists and has correct role/organization
        User adminUser = validateAndGetAdmin(adminUserId, organizationId, environment);

        User customer = new User();
        customer.setId(UUID.randomUUID());
        customer.setOrganizationId(organizationId);
        customer.setEnvironment(environment);
        customer.setName(name);
        customer.setEmail(email);
        customer.setPhone(phone);
        customer.setRole(UserRole.CUSTOMER);
        customer.setStatus(UserStatus.ACTIVE);
        customer.setAdminUserId(adminUserId);
        customer.setMetadata(metadata);
        customer.setCreatedAt(Instant.now());

        // Set organizational context for customer
        ObjectNode orgContext = objectMapper.createObjectNode();
        orgContext.put("admin_user_id", adminUserId.toString());
        orgContext.put("hierarchy_level", 1);
        orgContext.put("created_via", "api");
        orgContext.put("customer_privileges", true);

        customer.setOrganizationalContext(orgContext.toString());

        User savedCustomer = userRepository.save(customer);

        // Update admin's customer count atomically
        updateAdminCustomerCount(adminUserId);

        logger.info("Created customer user {} associated with admin {} in organization {}",
                   savedCustomer.getId(), adminUserId, organizationId);

        return savedCustomer;
    }

    /**
     * Transfers customer from one admin to another within same organization.
     * Ensures ACID compliance and organizational integrity.
     */
    @Transactional(isolation = Isolation.SERIALIZABLE, propagation = Propagation.REQUIRED)
    public User transferCustomer(UUID customerId, UUID newAdminId) {

        logger.info("Transferring customer {} to new admin {}", customerId, newAdminId);

        User customer = userRepository.findById(customerId)
            .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));

        if (customer.getRole() != UserRole.CUSTOMER) {
            throw new IllegalArgumentException("User is not a customer: " + customerId);
        }

        UUID oldAdminId = customer.getAdminUserId();

        // Validate new admin
        User newAdmin = validateAndGetAdmin(newAdminId, customer.getOrganizationId(),
                                          customer.getEnvironment());

        // Update customer's admin relationship
        customer.setAdminUserId(newAdminId);

        // Update organizational context
        try {
            JsonNode context = objectMapper.readTree(customer.getOrganizationalContext());
            ((ObjectNode) context).put("admin_user_id", newAdminId.toString());
            ((ObjectNode) context).put("transferred_at", Instant.now().toString());
            ((ObjectNode) context).put("previous_admin_id", oldAdminId != null ? oldAdminId.toString() : null);

            customer.setOrganizationalContext(context.toString());
        } catch (Exception e) {
            logger.warn("Failed to update organizational context for customer {}: {}",
                       customerId, e.getMessage());
        }

        User updatedCustomer = userRepository.save(customer);

        // Update customer counts for both admins
        if (oldAdminId != null) {
            updateAdminCustomerCount(oldAdminId);
        }
        updateAdminCustomerCount(newAdminId);

        logger.info("Successfully transferred customer {} from admin {} to admin {}",
                   customerId, oldAdminId, newAdminId);

        return updatedCustomer;
    }

    /**
     * Gets organizational hierarchy for an admin user.
     */
    @Transactional(readOnly = true)
    public OrganizationalHierarchy getOrganizationalHierarchy(UUID adminUserId) {
        User admin = userRepository.findById(adminUserId)
            .orElseThrow(() -> new IllegalArgumentException("Admin not found: " + adminUserId));

        if (admin.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("User is not an admin: " + adminUserId);
        }

        List<User> customers = userRepository.findCustomersByAdmin(adminUserId);

        return new OrganizationalHierarchy(admin, customers);
    }

    /**
     * Validates organizational constraints for user operations.
     */
    @Transactional(readOnly = true)
    public void validateOrganizationalIntegrity(UUID organizationId, Environment environment) {
        // Check for orphaned customers
        List<User> orphanedCustomers = userRepository.findOrphanedCustomers(organizationId, environment);
        if (!orphanedCustomers.isEmpty()) {
            logger.warn("Found {} orphaned customers in organization {} environment {}",
                       orphanedCustomers.size(), organizationId, environment);
        }

        // Check for circular references (should be prevented by constraints, but double-check)
        List<User> admins = userRepository.findAdminsByOrganization(organizationId, environment);
        for (User admin : admins) {
            if (hasCircularReference(admin.getId(), admin.getAdminUserId(), 5)) {
                throw new IllegalStateException("Circular admin reference detected for user: " + admin.getId());
            }
        }
    }

    /**
     * Deactivates user while maintaining organizational integrity.
     */
    @Transactional(isolation = Isolation.SERIALIZABLE, propagation = Propagation.REQUIRED)
    public User deactivateUser(UUID userId, String reason) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (user.getRole() == UserRole.ADMIN) {
            // Check if admin has active customers
            List<User> activeCustomers = userRepository.findActiveCustomersByAdmin(userId);
            if (!activeCustomers.isEmpty()) {
                throw new IllegalStateException(
                    String.format("Cannot deactivate admin %s: has %d active customers. " +
                                "Transfer customers first.", userId, activeCustomers.size()));
            }
        }

        user.setStatus(UserStatus.INACTIVE);
        user.setDeactivatedAt(Instant.now());

        // Update organizational context
        try {
            JsonNode context = objectMapper.readTree(user.getOrganizationalContext());
            ((ObjectNode) context).put("deactivated_at", Instant.now().toString());
            ((ObjectNode) context).put("deactivation_reason", reason);

            user.setOrganizationalContext(context.toString());
        } catch (Exception e) {
            logger.warn("Failed to update organizational context for user {}: {}",
                       userId, e.getMessage());
        }

        User deactivatedUser = userRepository.save(user);

        // If customer was deactivated, update admin's customer count
        if (user.getRole() == UserRole.CUSTOMER && user.getAdminUserId() != null) {
            updateAdminCustomerCount(user.getAdminUserId());
        }

        logger.info("Deactivated user {} with reason: {}", userId, reason);

        return deactivatedUser;
    }

    // Private helper methods

    private User validateAndGetAdmin(UUID adminUserId, UUID organizationId, Environment environment) {
        User admin = userRepository.findById(adminUserId)
            .orElseThrow(() -> new IllegalArgumentException("Admin user not found: " + adminUserId));

        if (admin.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Referenced user is not an admin: " + adminUserId);
        }

        if (!admin.getOrganizationId().equals(organizationId)) {
            throw new IllegalArgumentException("Admin belongs to different organization");
        }

        if (admin.getEnvironment() != environment) {
            throw new IllegalArgumentException("Admin belongs to different environment");
        }

        if (admin.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Admin is not active: " + adminUserId);
        }

        return admin;
    }

    private void updateAdminCustomerCount(UUID adminUserId) {
        try {
            int customerCount = userRepository.countActiveCustomersByAdmin(adminUserId);
            User admin = userRepository.findById(adminUserId).orElse(null);

            if (admin != null) {
                JsonNode context = objectMapper.readTree(admin.getOrganizationalContext());
                ((ObjectNode) context).put("customer_count", customerCount);
                ((ObjectNode) context).put("last_updated", Instant.now().toString());

                admin.setOrganizationalContext(context.toString());
                userRepository.save(admin);
            }
        } catch (Exception e) {
            logger.warn("Failed to update customer count for admin {}: {}",
                       adminUserId, e.getMessage());
        }
    }

    private boolean hasCircularReference(UUID userId, UUID adminUserId, int maxDepth) {
        if (adminUserId == null || maxDepth <= 0) {
            return false;
        }

        if (userId.equals(adminUserId)) {
            return true;
        }

        User admin = userRepository.findById(adminUserId).orElse(null);
        if (admin == null) {
            return false;
        }

        return hasCircularReference(userId, admin.getAdminUserId(), maxDepth - 1);
    }

    // Data classes

    public static class OrganizationalHierarchy {
        private final User admin;
        private final List<User> customers;

        public OrganizationalHierarchy(User admin, List<User> customers) {
            this.admin = admin;
            this.customers = customers;
        }

        public User getAdmin() {
            return admin;
        }

        public List<User> getCustomers() {
            return customers;
        }

        public int getCustomerCount() {
            return customers.size();
        }
    }
}
