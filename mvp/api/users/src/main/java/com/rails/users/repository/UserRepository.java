package com.rails.users.repository;

import com.rails.users.model.Environment;
import com.rails.users.model.User;
import com.rails.users.model.UserRole;
import com.rails.users.model.UserStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    // Organizational hierarchy queries

    @Query(
        "SELECT u FROM User u WHERE u.organizationId = :organizationId AND u.environment = :environment AND u.role = :role AND u.status = :status"
    )
    List<User> findByOrganizationAndEnvironmentAndRoleAndStatus(
        @Param("organizationId") UUID organizationId,
        @Param("environment") Environment environment,
        @Param("role") UserRole role,
        @Param("status") UserStatus status
    );

    @Query(
        "SELECT u FROM User u WHERE u.organizationId = :organizationId AND u.environment = :environment AND u.role = 'ADMIN' AND u.organizationalContext LIKE '%\"is_primary_admin\":true%' AND u.status = 'ACTIVE'"
    )
    Optional<User> findPrimaryAdminByOrganization(
        @Param("organizationId") UUID organizationId,
        @Param("environment") Environment environment
    );

    @Query(
        "SELECT u FROM User u WHERE u.organizationId = :organizationId AND u.environment = :environment AND u.role = 'ADMIN' AND u.status = 'ACTIVE'"
    )
    List<User> findAdminsByOrganization(
        @Param("organizationId") UUID organizationId,
        @Param("environment") Environment environment
    );

    @Query(
        "SELECT u FROM User u WHERE u.adminUserId = :adminUserId AND u.role = 'CUSTOMER'"
    )
    List<User> findCustomersByAdmin(@Param("adminUserId") UUID adminUserId);

    @Query(
        "SELECT u FROM User u WHERE u.adminUserId = :adminUserId AND u.role = 'CUSTOMER' AND u.status = 'ACTIVE'"
    )
    List<User> findActiveCustomersByAdmin(
        @Param("adminUserId") UUID adminUserId
    );

    @Query(
        "SELECT COUNT(u) FROM User u WHERE u.adminUserId = :adminUserId AND u.role = 'CUSTOMER' AND u.status = 'ACTIVE'"
    )
    int countActiveCustomersByAdmin(@Param("adminUserId") UUID adminUserId);

    @Query(
        "SELECT u FROM User u WHERE u.organizationId = :organizationId AND u.environment = :environment AND u.role = 'CUSTOMER' AND u.adminUserId IS NULL AND u.status = 'ACTIVE'"
    )
    List<User> findOrphanedCustomers(
        @Param("organizationId") UUID organizationId,
        @Param("environment") Environment environment
    );

    @Query(
        "SELECT u FROM User u WHERE u.organizationId = :organizationId AND u.environment = :environment AND u.adminUserId = :adminUserId"
    )
    List<User> findUsersByAdminInOrganization(
        @Param("organizationId") UUID organizationId,
        @Param("environment") Environment environment,
        @Param("adminUserId") UUID adminUserId
    );

    @Query(
        "SELECT u FROM User u WHERE u.email = :email AND u.organizationId = :organizationId AND u.environment = :environment"
    )
    Optional<User> findByEmailAndOrganizationAndEnvironment(
        @Param("email") String email,
        @Param("organizationId") UUID organizationId,
        @Param("environment") Environment environment
    );
}
