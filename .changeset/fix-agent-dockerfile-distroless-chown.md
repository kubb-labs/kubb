---
'@kubb/agent': patch
---

Fix Docker build failure on distroless image by replacing `RUN chown` (requires a shell) with `--chown` flags on `COPY` instructions.
