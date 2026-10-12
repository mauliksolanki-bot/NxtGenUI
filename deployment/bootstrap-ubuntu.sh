#!/usr/bin/env bash
# One-time VM setup: sudo bash deployment/bootstrap-ubuntu.sh YOUR_UBUNTU_USERNAME
set -euo pipefail

deploy_user=${1:?Usage: sudo bash bootstrap-ubuntu.sh USERNAME [SERVER_HOST] [API_UPSTREAM]}
server_host=${2:-172.198.161.188}
api_upstream=${3:-http://127.0.0.1:8080}
root=/opt/nxtgen

[[ $EUID -eq 0 ]] || { echo 'Run this setup script with sudo.' >&2; exit 1; }
id "$deploy_user" >/dev/null
[[ $server_host =~ ^[a-zA-Z0-9.-]+$ ]] || { echo 'Invalid server host.' >&2; exit 1; }
[[ $api_upstream =~ ^https?://[a-zA-Z0-9.-]+:[0-9]+$ ]] || { echo 'API upstream must be http(s)://HOST:PORT.' >&2; exit 1; }

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y nginx curl util-linux
install -d -m 755 -o "$deploy_user" -g www-data "$root" "$root/releases"

cat > /etc/nginx/sites-available/nxtgen <<EOF
server {
    listen 80;
    server_name ${server_host};
    root /opt/nxtgen/current/dist;
    index index.html;

    location /api/ {
        proxy_pass ${api_upstream};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 6m;
        proxy_read_timeout 120s;
    }

    location /assets/ {
        try_files \$uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

ln -sfn /etc/nginx/sites-available/nxtgen /etc/nginx/sites-enabled/nxtgen
nginx -t
systemctl enable --now nginx
systemctl reload nginx
echo "NxtGen folder prepared: $root"
echo "Website after deployment: http://$server_host"
