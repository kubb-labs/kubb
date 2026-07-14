---
'@kubb/kit': patch
---

Add `Url.toGroupedTemplateString` to the `Url` helper exposed through `kubb/kit`.

It renders a template literal that reads each path parameter off a grouped `path` request option, e.g. `` `/pet/${path.petId}` ``, keeping the parameter name exactly as it appears in the OpenAPI path. A name falls back to bracket access (`` path['pet-id'] ``) only when it isn't a valid JS identifier.
