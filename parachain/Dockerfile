FROM paritytech/ci-linux:latest as builder

# Install required tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    clang \
    libclang-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /evidex-parachain

# Copy source code
COPY . .

# Build the parachain
RUN cargo build --release

# Runtime image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create user
RUN useradd -m -u 1000 evidex

# Copy binary from builder
COPY --from=builder /evidex-parachain/target/release/evidex-parachain /usr/local/bin/

# Set permissions
RUN chmod +x /usr/local/bin/evidex-parachain

# Switch to non-root user
USER evidex

# Expose ports
EXPOSE 30333 9933 4033

# Default command
CMD ["/usr/local/bin/evidex-parachain"]
