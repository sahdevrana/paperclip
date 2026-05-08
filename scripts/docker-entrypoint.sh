#!/bin/sh
set -e

# Capture runtime UID/GID from environment variables, defaulting to 1000
PUID=${USER_UID:-1000}
PGID=${USER_GID:-1000}

# Adjust the node user's UID/GID if they differ from the runtime request
# and fix volume ownership only when a remap is needed
changed=0

if [ "$(id -u node)" -ne "$PUID" ]; then
    echo "Updating node UID to $PUID"
    usermod -o -u "$PUID" node
    changed=1
fi

if [ "$(id -g node)" -ne "$PGID" ]; then
    echo "Updating node GID to $PGID"
    groupmod -o -g "$PGID" node
    usermod -g "$PGID" node
    changed=1
fi

if [ "$changed" = "1" ]; then
    chown -R node:node /paperclip
fi

# Always fix ownership of .codex directories that may have been created by root
# (e.g., via `docker exec` or when codex CLI is run as root inside the container).
# Codex stores session/auth data under $HOME/.codex which must be readable by the node user.
CODEX_SHARED_HOME="${PAPERCLIP_HOME:-/paperclip}/.codex"
if [ -e "$CODEX_SHARED_HOME" ]; then
    chown -R node:node "$CODEX_SHARED_HOME" 2>/dev/null || true
fi
# Also fix Paperclip-managed per-company codex homes under the instances directory
INSTANCE_CODEX_BASE="${PAPERCLIP_HOME:-/paperclip}/instances"
if [ -d "$INSTANCE_CODEX_BASE" ]; then
    find "$INSTANCE_CODEX_BASE" -name "codex-home" -type d 2>/dev/null | while read -r dir; do
        chown -R node:node "$dir" 2>/dev/null || true
    done
fi

exec gosu node "$@"
