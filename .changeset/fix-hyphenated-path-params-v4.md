---
"@kubb/plugin-msw": patch
---

Fix `URLPath#URL` producing an invalid Express-style route for a hyphenated path parameter (e.g. `{point-id}` became `:point-id`). `path-to-regexp` treats a hyphen as ending the parameter name, so the generated MSW handler matched `:point` followed by a literal `-id` and rejected valid values. `toURLPath` now camelCases the parameter name the same way `toTemplateString` already does, so `{point-id}` becomes `:pointId`.
