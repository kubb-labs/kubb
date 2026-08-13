---
'@kubb/core': patch
---

Release file-processing updates as they happen instead of holding the whole batch.

The write pass bounds how many files it parses at once, but the driver collected every row it emitted and only handed them to `kubb:files:processing:update` once the last file had landed. Each row carries the parsed source, so the whole output tree sat in memory until the batch finished, and progress arrived in one jump at the end.

A row now goes out as soon as every earlier one has. That keeps them in generation order, and the only rows waiting are the ones the concurrent writes finished early.

Measured on 5000 generated files of about 8KB, medians of three runs alternating between the two builds: peak heap drops from 102MB to 67MB, peak RSS from 179MB to 141MB. Generation time is unchanged.
