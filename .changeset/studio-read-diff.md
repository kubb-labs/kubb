---
'@kubb/studio': patch
---

Add `readDiff` to the agent, so Studio can show the diff of a large generated file without downloading it whole. The agent compares the file between two kept sets and returns only the changed lines with three lines of context, one page at a time. Studio reads more pages as you scroll. Reading a diff needs the same `--allow-read` permission as reading files.

**Breaking:** `@kubb/studio/protocol` now exports const enums instead of loose constants. Replace `GENERATION_GONE_MESSAGE`, `READ_NOT_ALLOWED_MESSAGE`, `READ_AST_NOT_ALLOWED_MESSAGE`, and `NO_INPUT_MESSAGE` with `AgentMessage.GENERATION_GONE`, `AgentMessage.READ_NOT_ALLOWED`, `AgentMessage.READ_AST_NOT_ALLOWED`, and `AgentMessage.NO_INPUT`. `FileSource` and the new `AgentPermission` are const enums too, such as `FileSource.DISK` and `AgentPermission.READ`.
