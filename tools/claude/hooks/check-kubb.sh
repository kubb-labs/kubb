#!/usr/bin/env sh
# Warn at session start when the Kubb CLI is not available. This never installs
# anything: the commands run `npx kubb`, which prefers a project-local install
# and falls back to a global one, so the user decides how Kubb is installed.

if command -v kubb >/dev/null 2>&1; then
  exit 0
fi

if [ -x node_modules/.bin/kubb ]; then
  exit 0
fi

cat >&2 <<'EOF'
Kubb CLI not found. The Kubb plugin commands run `npx kubb`, so install it first:
  npm install -D kubb   # in the project
  npm install -g kubb   # or globally
EOF
exit 2
