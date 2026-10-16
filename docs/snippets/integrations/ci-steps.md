## Prerequisites

- A repository with a working `kubb.config.ts` on Kubb 5.6.2 or later. Follow [Installation](/docs/5.x/how-to/installation) if you have not set up Kubb.
- A [Kubb Studio](/docs/5.x/integrations/studio) organization and an organization CI API key, stored as `KUBB_TOKEN` in a secret only trusted pipelines can read. Snapshot installation uses a separate registry key. Create both in Studio under Settings › Developers › Tokens, with type CI for `KUBB_TOKEN` and type Registry for installs.
