---
'@kubb/studio': patch
---

Make config edits from Kubb Studio safe and precise, rewriting only the text an edit targets.

- Refuse a malformed edit on its own, with a reason, instead of failing the whole save.
- Refuse `__proto__`, `constructor`, and `prototype` as option names, so an edit can no longer break the next connect.
- Treat methods, getters, and options a later spread can override as customized in code.
- Scope `enable-plugin` to the config entry it names, list a disabled plugin in its place with its options, and support `module.exports` configs.
- Add a plugin on its own line without reformatting the `plugins` array, so it can still be disabled afterwards.
