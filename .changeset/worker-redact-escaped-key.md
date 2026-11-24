---
'@kubb/cli': patch
---

The background Studio worker also redacts the agent's private key when a log line prints it inside an object, where its newlines appear escaped. A rejected `KUBB_REGISTRY` URL is printed without its username and password.
