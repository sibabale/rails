package com.rails.users.config;

import com.rails.users.security.EnvironmentAndIdempotencyFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WebConfig {

    @Bean
    public FilterRegistrationBean<EnvironmentAndIdempotencyFilter> environmentAndIdempotencyFilter() {
        FilterRegistrationBean<EnvironmentAndIdempotencyFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(new EnvironmentAndIdempotencyFilter());
        bean.setOrder(1);
        return bean;
    }
}
