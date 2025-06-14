FROM node:22-bullseye

RUN dpkg --add-architecture i386 \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    wine64 wine32 mono-devel nsis \
    && ln -s /usr/bin/wine64 /usr/bin/wine \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
