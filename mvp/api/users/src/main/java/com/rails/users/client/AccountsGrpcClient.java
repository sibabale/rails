package com.rails.users.client;

import com.rails.accounts.v1.AccountsServiceGrpc;
import com.rails.accounts.v1.CreateDefaultAccountRequest;
import com.rails.accounts.v1.CreateDefaultAccountResponse;
import com.rails.accounts.v1.Environment;
import io.grpc.ManagedChannel;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class AccountsGrpcClient {

    private final AccountsServiceGrpc.AccountsServiceBlockingStub stub;

    public AccountsGrpcClient(ManagedChannel accountsManagedChannel) {
        this.stub = AccountsServiceGrpc.newBlockingStub(accountsManagedChannel);
    }

    public CreateDefaultAccountResponse createDefaultAccount(UUID organizationId, String env, UUID userId) {
        Environment environment = switch (env.toLowerCase()) {
            case "sandbox" -> Environment.SANDBOX;
            case "production" -> Environment.PRODUCTION;
            default -> throw new IllegalArgumentException("Invalid environment: " + env);
        };

        CreateDefaultAccountRequest request = CreateDefaultAccountRequest.newBuilder()
                .setOrganizationId(organizationId.toString())
                .setEnvironment(environment)
                .setUserId(userId.toString())
                .build();

        return stub
                .withDeadlineAfter(Duration.ofSeconds(2).toMillis(), TimeUnit.MILLISECONDS)
                .createDefaultAccount(request);
    }
}
