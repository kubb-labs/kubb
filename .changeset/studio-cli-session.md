---
'@kubb/cli': minor
---

Rework the `kubb studio` terminal output. Pairing shows the link and a short code with a live countdown, and copies the code to the clipboard when the platform has a tool for it. Permissions are asked once in one list instead of one question each, and the flags still grant on top. A connected session prints the project with its permissions, logs each job with its time and result, and moves to the background worker when you press `b`. `kubb studio status` prints one table where each row ends with the command that changes it, including the worker's uptime.

`kubb studio snapshot` prints one line per step and a short summary with the diff and the install command. It shows the snapshot number and a `View` link when Studio sends them, and `--json` gains the matching `number` and `webUrl` fields.
