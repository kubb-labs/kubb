---
"@kubb/cli": minor
"kubb": minor
---

Remove the `kubb agent` command and drop `@kubb/agent` as a peer dependency of `@kubb/cli` and `kubb`. The HTTP agent server has moved out of this repository and is now deployed as the `kubblabs/kubb-agent` Docker image. To run the agent, use the published Docker image instead of the CLI.
