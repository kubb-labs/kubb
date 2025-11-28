---
"@kubb/plugin-pinia-colada": minor
---

New plugin for generating Pinia Colada hooks from OpenAPI specifications. Supports `useQuery` and `useMutation` hooks generation for Vue.js applications using Pinia Colada.

Features:
- Generate `useQuery` hooks for GET operations
- Generate `useMutation` hooks for POST, PUT, PATCH, DELETE operations
- Full TypeScript support with proper Vue reactivity types (MaybeRefOrGetter)
- Compatible with Vue 3 and Pinia
- Uses Pinia Colada's `defineQuery` and `useMutation` patterns
