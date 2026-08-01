FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
# Apply pending schema changes before the web server accepts production traffic.
# Drizzle tracks applied migrations, so repeated starts are safe.
CMD ["sh", "-c", "npm run db:migrate && npm run start -- --host 0.0.0.0"]
