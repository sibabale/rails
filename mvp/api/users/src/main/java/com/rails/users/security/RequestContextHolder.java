package com.rails.users.security;

public final class RequestContextHolder {
    private static final ThreadLocal<RequestContext> CONTEXT = new ThreadLocal<>();

    private RequestContextHolder() {
    }

    public static void set(RequestContext context) {
        CONTEXT.set(context);
    }

    public static RequestContext getRequired() {
        RequestContext ctx = CONTEXT.get();
        if (ctx == null) {
            throw new IllegalStateException("Request context not initialized");
        }
        return ctx;
    }

    public static RequestContext get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
