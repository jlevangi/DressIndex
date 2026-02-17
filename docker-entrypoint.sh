#!/bin/sh
cat <<EOF > /usr/share/nginx/html/config.js
window.__CONFIG__ = {
  PIRATE_WEATHER_API_KEY: "${VITE_PIRATE_WEATHER_API_KEY:-}"
};
EOF
exec "$@"
