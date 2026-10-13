---
layout: doc
title: Use Kubb with Context7
description: Connect Context7 to your AI assistant and use current Kubb
  documentation when generating code or configuring Kubb.
outline:
  - 2
  - 3
order: 2
navigation:
  title: Context7
  icon: i-iconoir-code-brackets
---

# Use Kubb with Context7

Kubb's documentation is indexed on [Context7](https://context7.com) under the library ID `/kubb-labs/kubb`.

::steps{level="2"}

## Set up Context7

Run the interactive setup and select your AI assistant:

```shell [Terminal]
npx ctx7 setup
```

The setup connects Context7 through MCP or installs its documentation skill, depending on the
option you select.

## Use Kubb documentation

Include `use context7` in your prompt. Add the Kubb library ID when you want to skip library
discovery:

```text [Prompt]
Create a kubb.config.ts that generates TypeScript types, a Fetch client, and React Query hooks
from ./petStore.yaml. Use Context7 library /kubb-labs/kubb.
```

A rule in your assistant's instructions can make it use Context7 for every Kubb question.

::

## See also

- [Kubb on Context7](https://context7.com/kubb-labs/kubb)
- [Context7 setup](https://context7.com/docs/clients/cli)
- [Kubb MCP server](/docs/5.x/ai/mcp)
