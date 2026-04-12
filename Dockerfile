FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsup.config.ts ./
COPY src ./src

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY src/data ./dist/data

# Copy prompts to /app/prompts for volume mount override
COPY prompts ./prompts
ENV PROMPTS_DIR=/app/prompts

EXPOSE 4000

CMD ["node", "dist/app.js"]
