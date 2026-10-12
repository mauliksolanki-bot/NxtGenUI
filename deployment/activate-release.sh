#!/usr/bin/env bash
set -euo pipefail

root=${1:?Deployment root is required}
release_id=${2:?Release ID is required}
server_host=${3:?Server host is required}
[[ $root == /opt/nxtgen ]] || { echo 'Deployment root must be /opt/nxtgen.' >&2; exit 1; }
[[ $release_id =~ ^[0-9]+$ ]] || { echo 'Invalid release ID.' >&2; exit 1; }
[[ $server_host =~ ^[a-zA-Z0-9.-]+$ ]] || { echo 'Invalid server host.' >&2; exit 1; }
release="$root/releases/$release_id"
test -s "$release/dist/index.html"

# Serialize activation when multiple pipelines finish close together.
exec 9>"$root/.deployment.lock"
flock -w 120 9
previous=$(readlink "$root/current" || true)
temporary="$root/.current-$release_id"
[[ ! -e "$temporary" && ! -L "$temporary" ]] || { echo 'Temporary activation link already exists.' >&2; exit 1; }
[[ ! -e "$root/current" || -L "$root/current" ]] || { echo 'current must be a symlink.' >&2; exit 1; }

chmod -R a+rX "$release/dist"
ln -s "$release" "$temporary"
mv -Tf "$temporary" "$root/current"

restore_previous() {
    if [[ -n "$previous" ]]; then
        ln -s "$previous" "$temporary"
        mv -Tf "$temporary" "$root/current"
    else
        unlink "$root/current"
    fi
    echo 'Website verification failed; restored the previous release.' >&2
}

response=$(mktemp)
trap 'rm -f "$response"' EXIT
if ! curl --fail --silent --show-error --retry 3 --retry-delay 2 --max-time 15 \
    -H "Host: $server_host" http://127.0.0.1/index.html -o "$response" \
    || ! cmp -s "$response" "$release/dist/index.html"; then
    restore_previous
    exit 1
fi

echo "NxtGenUI release $release_id is live at http://$server_host"
