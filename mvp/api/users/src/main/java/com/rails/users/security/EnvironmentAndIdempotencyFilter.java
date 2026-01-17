package com.rails.users.security;

import com.rails.users.model.Environment;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class EnvironmentAndIdempotencyFilter extends OncePerRequestFilter {

    public static final String HEADER_ENV = "X-Rails-Env";
    public static final String HEADER_IDEMPOTENCY_KEY = "Idempotency-Key";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            Environment env = Environment.fromHeader(request.getHeader(HEADER_ENV));
            RequestContextHolder.set(new RequestContext(null, env, null, "ANON"));

            if (requiresIdempotencyKey(request)) {
                String key = request.getHeader(HEADER_IDEMPOTENCY_KEY);
                if (key == null || key.isBlank()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"missing_idempotency_key\",\"message\":\"Idempotency-Key header is required\"}");
                    return;
                }
                request.setAttribute(HEADER_IDEMPOTENCY_KEY, key.trim());
            }

            filterChain.doFilter(request, response);
        } finally {
            RequestContextHolder.clear();
        }
    }

    private boolean requiresIdempotencyKey(HttpServletRequest request) {
        String method = request.getMethod();
        return HttpMethod.POST.matches(method)
                || HttpMethod.PUT.matches(method)
                || HttpMethod.PATCH.matches(method)
                || HttpMethod.DELETE.matches(method);
    }
}
