# Minimal Dockerfile to build and serve the Vite app on Railway.
# Build arg so Gemini API key can be set in Railway (Variables → add VITE_GEMINI_API_KEY).
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
ENV PORT=3000
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
