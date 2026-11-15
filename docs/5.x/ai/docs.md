---
layout: doc
title: Give an assistant the Kubb docs
description: Give an AI assistant current Kubb documentation through Context7 or the llms.txt and llms-full.txt files, so it writes a correct kubb.config.ts.
outline:
  - 2
  - 3
order: 3
navigation:
  title: Docs for assistants
  icon: i-iconoir-page-search
---

# Give an assistant the Kubb docs

An assistant that reads the current docs writes a `kubb.config.ts` for Kubb v5, not an older version. Pick the option your assistant supports.

| Option | Works with | Context it loads |
| --- | --- | --- |
| [Context7](#context7) | Assistants with the Context7 MCP server or skill | The pages that match your prompt |
| [`llms.txt`](#llms-txt) | Any assistant that reads URLs or pasted text | An index, or the full docs in one file |

## Context7 {#context7}

[Context7](https://context7.com) indexes the Kubb docs under the library ID `/kubb-labs/kubb`.

::steps{level="3"}

### Set up Context7

Run the setup and select your assistant:

```shell [Terminal]
npx ctx7 setup
```

The setup connects Context7 through MCP or installs its docs skill, as you choose.

### Ask with Context7

Include `use context7` in your prompt. Add the library ID to skip the library search:

```text [Prompt]
Create a kubb.config.ts that generates TypeScript types, a Fetch client, and React Query hooks
from ./petStore.yaml. Use Context7 library /kubb-labs/kubb.
```

::

> [!TIP]
> Add a rule to your assistant's instructions to use Context7 for every Kubb question.

## llms.txt {#llms-txt}

| File | Holds |
| --- | --- |
| [`https://kubb.dev/llms.txt`](https://kubb.dev/llms.txt) | A table of contents with a one-line description per page |
| [`https://kubb.dev/llms-full.txt`](https://kubb.dev/llms-full.txt) | The complete docs in one file |

Use the full file for complete coverage:

```text [Prompt]
Read https://kubb.dev/llms-full.txt and answer questions about Kubb.
```

For a small context window, use the index so the assistant fetches pages on demand:

```text [Prompt]
Use https://kubb.dev/llms.txt to find relevant pages, then read them.
```
