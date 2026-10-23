---
"@kubb/adapter-oas": patch
---

Map `format: uri-reference`, `hostname` and `idn-hostname` to a `string` node instead of `url`. `plugin-zod` now prints `z.string()` for them, so relative references such as `/media/picture.jpg` and bare host names such as `example.com` pass validation. The node keeps its `format`, `minLength`, `maxLength` and `pattern`.
