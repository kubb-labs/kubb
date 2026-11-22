---
'@kubb/renderer-jsx': patch
---

Add `Source`, a block of code in a `File` that no declaration component covers, such as text from a printer, a statement like `faker.seed(1)`, or a JSON file. It takes the same props as `File.Source`, which is now its deprecated name.

```diff
- <File.Source name="Pet" isExportable isIndexable>{printed}</File.Source>
+ <Source name="Pet" isExportable isIndexable>{printed}</Source>
```
