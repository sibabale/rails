package com.rails.users.event;

import com.rails.users.model.OutboxEvent;
import com.rails.users.repository.OutboxEventRepository;
import io.nats.client.JetStream;
import io.nats.client.api.PublishAck;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@Component
@ConditionalOnProperty(prefix = "rails.nats", name = "enabled", havingValue = "true")
public class OutboxPublisher {

    private final JetStream jetStream;
    private final OutboxEventRepository outboxEventRepository;

    public OutboxPublisher(JetStream jetStream, OutboxEventRepository outboxEventRepository) {
        this.jetStream = jetStream;
        this.outboxEventRepository = outboxEventRepository;
    }

    @Scheduled(fixedDelayString = "${rails.outbox.publisher.delay-ms:200}")
    @Transactional
    public void publishUnsent() throws Exception {
        List<OutboxEvent> batch = outboxEventRepository.findTop100ByPublishedAtIsNullOrderByCreatedAtAsc();
        for (OutboxEvent event : batch) {
            PublishAck ack = jetStream.publish(event.getSubject(), event.getPayload().getBytes(StandardCharsets.UTF_8));
            if (ack != null) {
                event.setPublishedAt(Instant.now());
                outboxEventRepository.save(event);
            }
        }
    }
}
