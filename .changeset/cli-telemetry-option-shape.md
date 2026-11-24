---
'@kubb/cli': patch
---

Send only the shape of each plugin's options in telemetry. Booleans and numbers keep their value, and every other value is sent as its type name, so path, URL, banner and secret values in plugin options no longer leave the machine. Object keys are still sent as written.
