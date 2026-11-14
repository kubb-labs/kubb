---
'@kubb/adapter-oas': minor
'@kubb/kit': minor
---

Add `pathParamsCasing: 'camelcase'` to `adapterOas()`. It renames path parameters and their `{placeholder}` in the operation path, so `GET /pets/{pet-id}` is called as `getPet({ path: { petId } })`.

- `{pet-id}`, `{pet_id}`, and `{PetId}` all become `petId`, the name MSW routes and query keys then use too. Colliding names get a counter suffix (`groupId`, `groupId2`).
- Query, header, cookie, and body names stay as the spec writes them, and the HTTP request is unchanged.
- `@kubb/kit` adds `Url.toParamNames`, which maps each placeholder to a unique camelCase name.
