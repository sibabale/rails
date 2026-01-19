# syntax=docker/dockerfile:1
FROM rust:1.76 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bullseye-slim
WORKDIR /app
COPY --from=builder /app/target/release/users_service /usr/local/bin/users_service
COPY .env .
EXPOSE 8080
CMD ["/usr/local/bin/users_service"]
