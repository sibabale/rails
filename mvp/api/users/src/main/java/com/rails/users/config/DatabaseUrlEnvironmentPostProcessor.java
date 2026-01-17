package com.rails.users.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.LinkedHashMap;
import java.util.Map;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "railsDatabaseUrl";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return;
        }

        String trimmed = databaseUrl.trim();
        if (trimmed.startsWith("jdbc:")) {
            return;
        }

        if (!(trimmed.startsWith("postgres://") || trimmed.startsWith("postgresql://"))) {
            return;
        }

        try {
            URI uri = new URI(trimmed);

            String host = uri.getHost();
            int port = uri.getPort();
            String path = uri.getPath();
            String query = uri.getQuery();

            String userInfo = uri.getUserInfo();
            String username = null;
            String password = null;
            if (userInfo != null && !userInfo.isBlank()) {
                int idx = userInfo.indexOf(':');
                if (idx >= 0) {
                    username = userInfo.substring(0, idx);
                    password = userInfo.substring(idx + 1);
                } else {
                    username = userInfo;
                }
            }

            StringBuilder jdbc = new StringBuilder("jdbc:postgresql://");
            jdbc.append(host);
            if (port > 0) {
                jdbc.append(":").append(port);
            }
            jdbc.append(path);
            if (query != null && !query.isBlank()) {
                jdbc.append("?").append(query);
            }

            Map<String, Object> props = new LinkedHashMap<>();
            props.put("spring.datasource.url", jdbc.toString());
            if (username != null && !username.isBlank()) {
                props.put("spring.datasource.username", username);
            }
            if (password != null && !password.isBlank()) {
                props.put("spring.datasource.password", password);
            }

            MutablePropertySources sources = environment.getPropertySources();
            if (sources.contains(PROPERTY_SOURCE_NAME)) {
                sources.replace(PROPERTY_SOURCE_NAME, new MapPropertySource(PROPERTY_SOURCE_NAME, props));
            } else {
                sources.addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, props));
            }
        } catch (URISyntaxException ignored) {
            // If it's not a valid URI, we do nothing and let Spring error normally.
        }
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
