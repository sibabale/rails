FROM rust:1.92-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies (for crates using OpenSSL and tonic-build/protoc)
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    protobuf-compiler \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests and build script first for dependency caching
COPY Cargo.toml Cargo.lock build.rs ./

# Copy proto files (needed for build.rs to generate code)
COPY proto ./proto

# Create dummy src to cache dependencies
RUN mkdir -p src && echo "fn main() {}" > src/main.rs

# Build dependencies only (this will run build.rs but proto generation will fail - that's ok for dependency caching)
RUN cargo build --release || true

# Remove dummy source
RUN rm -rf src

# Copy actual source code and migrations
COPY src ./src
COPY migrations ./migrations

# Build the application (now with real source, proto files, and migrations)
RUN cargo build --release

FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/users_service /app/users_service

EXPOSE 8080

CMD ["/app/users_service"]
