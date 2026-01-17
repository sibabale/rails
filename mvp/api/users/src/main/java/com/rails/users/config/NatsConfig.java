package com.rails.users.config;

import io.nats.client.Connection;
import io.nats.client.JetStream;
import io.nats.client.JetStreamManagement;
import io.nats.client.Nats;
import io.nats.client.api.StorageType;
import io.nats.client.api.StreamConfiguration;
import io.nats.client.api.StreamInfo;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@ConditionalOnProperty(prefix = "rails.nats", name = "enabled", havingValue = "true")
public class NatsConfig {

    @Bean(destroyMethod = "close")
    public Connection natsConnection(@Value("${rails.nats.url}") String url) throws Exception {
        return Nats.connect(url);
    }

    @Bean
    public JetStreamManagement jetStreamManagement(Connection nc) throws Exception {
        return nc.jetStreamManagement();
    }

    @Bean
    public JetStream jetStream(Connection nc) throws Exception {
        return nc.jetStream();
    }

    @Bean
    public StreamInfo railsEventsStream(
            JetStreamManagement jsm,
            @Value("${rails.nats.stream}") String streamName
    ) throws Exception {
        StreamConfiguration cfg = StreamConfiguration.builder()
                .name(streamName)
                .storageType(StorageType.File)
                .maxAge(Duration.ofDays(7))
                .subjects(
                        "users.user.created.*.*",
                        "accounts.account.created.*.*"
                )
                .build();

        try {
            return jsm.getStreamInfo(streamName);
        } catch (Exception ignored) {
            return jsm.addStream(cfg);
        }
    }
}
