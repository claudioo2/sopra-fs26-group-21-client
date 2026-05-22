# Build image
FROM node:22.14.0 AS build

# Set container working directory to /app
WORKDIR /app

# Copy npm instructions
COPY package*.json ./

# Set npm cache
RUN npm config set cache /app/.npm-cache --global

# Install dependencies using exact versions from package-lock.json
RUN npm ci --loglevel=error

# Copy app source code
COPY . .

# Build the Next.js app
RUN npm run build

# Delete non-production dependencies
RUN npm prune --production


# Use small production image
FROM node:22.14.0-alpine

# Set production environment
ENV NODE_ENV=production

# Set container working directory
WORKDIR /app

# Set npm cache
RUN npm config set cache /app/.npm-cache --global

# Copy required files from build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

# Copy Next.js config if it exists
COPY --from=build /app/next.config.* ./

# Use non-root user
USER 3301

# Expose Next.js port
EXPOSE 3000

# Start Next.js production server
CMD ["npm", "start"]