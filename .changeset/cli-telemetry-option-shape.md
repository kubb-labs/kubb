---
'@kubb/cli': patch
---

Send only the shape of each plugin's options in telemetry. Booleans and numbers keep their value, and every other value is sent as its type name, so paths, URLs, banners and secrets in plugin options no longer leave the machine.
