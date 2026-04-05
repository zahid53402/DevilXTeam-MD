FROM node:22-alpine
RUN apk add --no-cache \
    git \
    ffmpeg \
    libwebp-tools \
    python3 \
    py3-pip \
    make \
    g++ \
    curl \
    bash
RUN python3 -m ensurepip 2>/dev/null; pip3 install --break-system-packages yt-dlp 2>/dev/null || pip3 install yt-dlp 2>/dev/null || true
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o /usr/local/bin/yt-dlp && chmod 755 /usr/local/bin/yt-dlp || \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod 755 /usr/local/bin/yt-dlp
WORKDIR /dkml
COPY package.json .
RUN npm install --legacy-peer-deps
COPY . .
RUN mkdir -p temp
ENV TZ=Asia/Kolkata
CMD ["node", "index.js"]
