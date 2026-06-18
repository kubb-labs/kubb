---
"@kubb/adapter-oas": patch
---

Stop `dedupe` from hoisting an inline operation-response schema under a name the operation already uses for its own type. A shared inline shape such as a `{ error?: string }` 400 response could be extracted as `PostV1WorkoutsStatus400`, colliding with the operation's generated response-status type and producing a self-referential `export type X = X` plus duplicate barrel exports. Such shapes now stay inline.
