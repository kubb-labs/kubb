# Security requirements

Constraints that always apply.

- Never commit secrets. Keep tokens, keys, and credentials in environment variables or a local
  `.env` (gitignored). Reference them, never inline them.
- Validate and sanitize input at trust boundaries (CLI arguments, file contents, network
  responses). Internal code is trusted, but external input is not.
- Avoid shell string interpolation of untrusted input. Prefer argument arrays and avoid
  `child_process` with `shell: true` on user-supplied data.
- Do not log secrets or full request and response bodies that might contain them.
- Keep dependencies trusted and current: prefer well-maintained packages, install against the
  committed lockfile, and review a new dependency before adding it.
- Never weaken safety to make something pass. Do not disable type checks, lint rules, or tests
  to hide a problem. Fix the root cause instead.
