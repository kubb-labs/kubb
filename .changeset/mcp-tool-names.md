---
'@kubb/mcp': minor
---

Breaking: every MCP tool now has a `kubb_` prefix, so the names stay unique next to the tools of other MCP servers. `generate`, `validate`, and `init` are now `kubb_generate`, `kubb_validate`, and `kubb_init`. Update any allow list, hook, or prompt that names a tool, such as `mcp__kubb__generate` in Claude Code, which is now `mcp__kubb__kubb_generate`.

Breaking: the parameters have specific names.

| Before | After | Tools |
| --- | --- | --- |
| `config` | `configPath` | `kubb_generate`, `kubb_diff`, `kubb_add`, `kubb_remove` |
| `input` | `inputPath` | `kubb_generate`, `kubb_validate`, `kubb_init` |
| `output` | `outputPath` | `kubb_generate`, `kubb_init` |
| `id` | `extensionId` | `kubb_add`, `kubb_remove` |
| `ids` | `extensionIds` | `kubb_update` |

- Each tool has a title, a description that says when to use it and what it returns, and MCP annotations. `kubb_validate`, `kubb_diff`, and `kubb_list` are read-only, and `kubb_generate`, `kubb_update`, and `kubb_remove` are destructive.
- `kubb_diff`, `kubb_add`, `kubb_update`, `kubb_remove`, and `kubb_list` return 30,000 characters at most. Longer output is cut and ends with an `[Output cut: ...]` notice.
- `kubb_generate` refuses a config whose `output.path` is outside the working directory, and `kubb_init` refuses such an `outputPath`, because `output.clean` empties that folder.
- `kubb_diff` accepts `format: 'summary'`, which returns one line per out-of-date file with its added and removed line counts.
