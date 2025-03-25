
#!/bin/sh
set -e

echo "Starting entrypoint script..."

# Replace environment variables in the JavaScript files
# Default to HTTPS URL if not provided
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|VITE_API_BASE_URL_PLACEHOLDER|${VITE_API_BASE_URL:-https://localhost:8000}|g" {} \;

echo "Environment variable substitution completed"

# Execute the CMD
exec "$@"
