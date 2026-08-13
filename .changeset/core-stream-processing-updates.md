---
'@kubb/core': patch
---

Release file-processing updates as they happen instead of holding the whole batch.

Every row was collected and only handed to `kubb:files:processing:update` once the last file had landed. Each row carries the parsed source, so the whole output tree sat in memory until the batch finished.

A row now goes out as soon as every earlier one has, which keeps them in generation order. On 5000 files of about 8KB, peak heap drops from 102MB to 67MB and peak RSS from 179MB to 141MB, with generation time unchanged.
