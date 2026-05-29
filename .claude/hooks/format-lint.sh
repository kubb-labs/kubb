#!/bin/bash
set -euo pipefail

# Stop hook: format and lint the workspace once Claude finishes a turn.
# Non-blocking; surfaces problems without failing the session.
cd "${CLAUDE_PROJECT_DIR:-.}"

pnpm format || true
pnpm lint || true
