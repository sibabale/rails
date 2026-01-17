package com.rails.users.event;

import io.nats.client.Connection;
import io.nats.client.Dispatcher;
import io.nats.client.JetStream;
import io.nats.client.Message;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;

@Component
@ConditionalOnProperty(prefix = "rails.nats", name = "enabled", havingValue = "true")
public class AccountCreatedSubscriber {

    private final Connection nc;
    private final JetStream js;
    private final String durable;

    public AccountCreatedSubscriber(Connection nc, JetStream js,
                                   @Value("${rails.nats.consumers.accountsCreatedDurable:users_account_created}") String durable) {
        this.nc = nc;
        this.js = js;
        this.durable = durable;
    }

    @PostConstruct
    public void start() throws Exception {
        Dispatcher dispatcher = nc.createDispatcher();

        js.subscribe("accounts.account.created.*.*", dispatcher, this::handleMessage, false);
    }

    private void handleMessage(Message msg) {
        String payload = new String(msg.getData(), StandardCharsets.UTF_8);
        System.out.println("[users] received account.created subject=" + msg.getSubject() + " payload=" + payload);
        msg.ack();
    }
}
