package com.rails.users.config;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GrpcConfig {

    @Bean(destroyMethod = "shutdown")
    public ManagedChannel accountsManagedChannel(
            @Value("${rails.accounts.grpc.host}") String host,
            @Value("${rails.accounts.grpc.port}") int port
    ) {
        return ManagedChannelBuilder
                .forAddress(host, port)
                .usePlaintext()
                .build();
    }
}
