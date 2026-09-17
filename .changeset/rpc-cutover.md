---
'@kubb/studio': patch
'@kubb/cli': patch
---

Replace the agent WebSocket command protocol with typed Cap'n Web RPC and remove the legacy JSON envelopes. Agents and Studio must upgrade together; mismatched versions cannot communicate.
