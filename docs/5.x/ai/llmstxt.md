---
layout: doc
title: Use documentation in an AI assistant
description: Kubb publishes llms.txt and llms-full.txt so LLMs can consume the
  full documentation in a single request. Learn how to point your AI assistant
  at these files.
outline:
  - 2
  - 3
order: 4
navigation:
  title: Documentation context
  icon: i-iconoir-page-search
---

# Use documentation in an AI assistant

Point an assistant that accepts URLs or pasted text at one of these files.

## Available files

| URL                                                                | Description                                           |
| ------------------------------------------------------------------ | ----------------------------------------------------- |
| [`https://kubb.dev/llms.txt`](https://kubb.dev/llms.txt)           | Table of contents with one-line descriptions per page |
| [`https://kubb.dev/llms-full.txt`](https://kubb.dev/llms-full.txt) | Complete documentation in a single file               |

## Use the files in a prompt

Use the full file for complete coverage:

```text [Prompt]
Read https://kubb.dev/llms-full.txt and answer questions about Kubb.
```

For a small context window, use the index and let the assistant fetch pages on demand:

```text [Prompt]
Use https://kubb.dev/llms.txt to find relevant pages, then read them.
```

## See also

- [llms.txt standard](https://llmstxt.org/): specification for LLM-friendly documentation
- [MCP](/docs/5.x/ai/mcp): connect AI editors directly to Kubb's MCP server
