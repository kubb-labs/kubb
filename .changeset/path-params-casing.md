---
'@kubb/adapter-oas': minor
'@kubb/kit': minor
---

Add `pathParamsCasing: 'camelcase'` to `adapterOas()`. It renames path parameters and their `{placeholder}` in the operation path, so `GET /pets/{pet-id}` is called as `getPet({ path: { petId } })`.

- Names match the ones MSW routes and query keys already use, and colliding names get a counter suffix (`groupId`, `groupId2`).
- Query, header, cookie, and body names stay as the spec writes them, and the HTTP request is unchanged.
- `@kubb/kit` adds `Url.toParamNames`, which maps each placeholder to the name `Url.toPath` gives it.
