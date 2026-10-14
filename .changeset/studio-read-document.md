---
"@kubb/studio": minor
"@kubb/cli": patch
---

Agents keep the parsed OpenAPI document of each generation and return it through the new `readDocument` call, so Kubb Studio can describe your API. Like `readFiles`, it is refused unless the agent was granted `--allow-read`, and the permission prompt now mentions the parsed spec.
