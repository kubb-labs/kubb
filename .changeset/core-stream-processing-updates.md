---
'@kubb/core': patch
---

Stop holding every generated source in memory during the write pass.

`kubb:files:processing:update` rows carried the file's parsed source, and the driver buffered every row until the last file had been written, so the whole output tree stayed live for the batch. Nothing read that field: the CLI loggers, the MCP tool, and the Studio agent all use `file`, `processed`, `total`, and `percentage`.

`source` is gone from `KubbFileProcessingUpdate`, and rows are skipped altogether when no listener is registered. Batching, ordering, and the single flush at the end of the pass are unchanged. On 5000 files of about 8KB, peak heap drops from 102MB to 68MB and peak RSS from 179MB to 141MB.
