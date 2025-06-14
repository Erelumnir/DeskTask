FROM node:22-bullseye

# Install Wine, Mono & NSIS
RUN dpkg --add-architecture i386 \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    wine64 wine32 mono-devel nsis \
    && ln -s /usr/bin/wine64 /usr/bin/wine \
    && rm -rf /var/lib/apt/lists/*

# Optional: set env to reduce Electron builder logging noise
ENV CI=true

# Working directory
WORKDIR /app
