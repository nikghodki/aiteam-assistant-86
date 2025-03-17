
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the build output from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a script to replace environment variables at runtime
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN apk add --no-cache bash && \
    chmod +x /docker-entrypoint.sh && \
    # Ensure correct line endings for the entrypoint script
    sed -i 's/\r$//' /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Start script that will handle env variable substitution
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
