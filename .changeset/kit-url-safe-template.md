---
'@kubb/kit': patch
---

Add `Url.toSafeTemplate` and `Url.toGroupedTemplateString` to the `Url` helper exposed through `kubb/kit`.

These cover path-template shapes that plugins previously had to reimplement themselves: `toSafeTemplate` rewrites OpenAPI path param names while keeping the `{...}` braces, and `toGroupedTemplateString` renders a template literal that reads each param off a grouped `path` request option (`` `/pet/${path.petId}` ``).
