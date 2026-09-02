# Using Generated Client Functions — Response Handling and unwrap()

## Overview

Every function that `@kubb/plugin-axios` and `@kubb/plugin-fetch` generate resolves to a structured result object — `RequestResult` — carrying the HTTP status, the typed response body, any error, the content type, and the underlying request and response objects. [[1]](https://docs.kubb.dev/plugins/plugin-axios)

This page covers two things:

1. **The shape of that result object** — what each field means and how `throwOnError` controls what you get back.
2. **The `unwrap()` method** — a new, always-available method on every generated call that extracts just the success body without destructuring.

Both topics apply equally to `@kubb/plugin-axios` and `@kubb/plugin-fetch`. The transport differs; the result contract does not. [[2]](https://docs.kubb.dev/plugins/plugin-axios/guide/error-handling)

## The RequestResult Object

Every generated function from `@kubb/plugin-axios` and `@kubb/plugin-fetch` returns a structured result wrapped in a promise [[1]](https://docs.kubb.dev/plugins/plugin-axios). The return type is `Unwrappable<RequestResult<TResponses, ThrowOnError>>`, where `RequestResult` is a status-discriminated union describing the response [[3]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-axios/templates/axios.ts#L69-L85).

### Six Fields

`RequestResult` carries six fields that expose every aspect of the response [[4]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-axios/templates/axios.ts#L35-L53):

- **`data`**: The typed success body. Defined on 2xx responses; `undefined` on error variants.
- **`error`**: The typed error body. `undefined` on success variants; defined when the status is outside 200–299.
- **`status`**: The HTTP status code as a numeric literal type, used to discriminate the union.
- **`contentType`**: The response `Content-Type` header as `string | undefined`, typed per-variant from the spec where content negotiation is documented.
- **`request`**: The underlying request object (`AxiosRequestConfig` for axios, `Request` for fetch) for advanced inspection.
- **`response`**: The underlying response object (`AxiosResponse` for axios, `Response` for fetch).

### Status-Discriminated Union

Only **one** of `data` or `error` is defined at a time. `RequestResult` is a union type keyed on `status`, so TypeScript narrows `data` and `error` correctly when you branch on the status code [[5]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-axios/templates/axios.ts#L44-L53).

Success variants (2xx status codes) have `error: undefined` and a defined `data` field [[6]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-axios/templates/axios.ts#L35-L39). Error variants (non-2xx status codes) have `data: undefined` and a defined `error` field [[7]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-axios/templates/axios.ts#L46-L52).

### Narrowing with `throwOnError`

The `ThrowOnError` generic parameter controls which status variants appear in the resolved type [[3]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-axios/templates/axios.ts#L69-L85):

- **`throwOnError: true` (default)**: The result narrows to success-only (2xx) variants. The `error` field is always `undefined`, so TypeScript knows `data` is defined [[8]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-axios/templates/axios.ts#L72-L82). Non-2xx responses throw a `ResponseError` before the promise resolves, so the result you await never contains an error variant. [[2]](https://docs.kubb.dev/plugins/plugin-axios/guide/error-handling)

- **`throwOnError: false`**: The result is the full union including error variants. Either `data` or `error` is defined, depending on the response status [[9]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-axios/templates/axios.ts#L83-L85). You branch on `result.error` or `result.status` to access the correct field. [[2]](https://docs.kubb.dev/plugins/plugin-axios/guide/error-handling)

This discriminated union shape allows you to handle success and error responses type-safely. When `throwOnError` is `true`, you read `data` directly without a guard; when `false`, you check which field is present or switch on `status` to narrow the type to the variant for that code. [[2]](https://docs.kubb.dev/plugins/plugin-axios/guide/error-handling)

## Standard Response Handling

Awaiting a generated function gives you the full `RequestResult` object. This is the default mode and covers the majority of use cases.

### With throwOnError: true (default)

The default `throwOnError: true` means a non-2xx response throws a `ResponseError` before the promise resolves. [[2]](https://docs.kubb.dev/plugins/plugin-axios/guide/error-handling) A resolved call always carries a success result, so `data` is always defined and `error` is always `undefined`:

```typescript
import { getPetById } from './gen/clients/getPetById'

const result = await getPetById({ path: { petId: 1 } })

console.log(result.status)      // 200
console.log(result.data)        // { id: 1, name: 'Fluffy', ... } — typed from the spec
console.log(result.contentType) // 'application/json'
console.log(result.request)     // the AxiosRequestConfig (or Request for fetch)
console.log(result.response)    // the AxiosResponse (or Response for fetch)
```

Destructuring works exactly as before:

```typescript
const { data, status } = await getPetById({ path: { petId: 1 } })
console.log(data.name)
```

Errors are caught with a standard `try`/`catch`:

```typescript
import { ResponseError } from './gen/.kubb/client'

try {
  const { data } = await getPetById({ path: { petId: 1 } })
  console.log(data.name)
} catch (error) {
  if (error instanceof ResponseError) {
    console.error(error.status) // 404
    console.error(error.data)   // the parsed error body
  }
}
```

### With throwOnError: false

Pass `throwOnError: false` and the call resolves for every documented status. The result is a discriminated union: `data` is set on success and `error` is set on failure. [[2]](https://docs.kubb.dev/plugins/plugin-axios/guide/error-handling)

```typescript
const result = await getPetById({ path: { petId: 1 }, throwOnError: false })

if (result.error) {
  console.error('Request failed:', result.status, result.error)
} else {
  console.log('Success:', result.data)
}
```

Switching on `result.status` narrows the body to the variant for that specific code, which is useful when different error statuses carry different shapes:

```typescript
const result = await updatePet({
  path: { petId: '123' },
  body: { name: 'Updated name' },
  throwOnError: false,
})

switch (result.status) {
  case 200:
    return result.data          // success body
  case 404:
    return notFound(result.error)
  case 422:
    return showValidationErrors(result.error)
}
```

## The unwrap() Method

Every generated function in `@kubb/plugin-axios` and `@kubb/plugin-fetch` now returns a promise extended with an `.unwrap()` method that extracts the success body directly, without requiring destructuring at every call site. The pattern follows Redux Toolkit's `dispatch(action).unwrap()` for consistency and composes cleanly with query plugins.

### What unwrap() Does

The standard response handling pattern for generated calls is:

```ts
const result = await getPetById({ path: { petId: 1 } })
const pet = result.data
```

With `.unwrap()`, you can go straight to the success body:

```ts
const pet = await getPetById({ path: { petId: 1 } }).unwrap()
```

No destructuring, no extra variable — just the typed data you requested.

### How It Works

At the type level, `unwrap()` is defined by three additions to both templates (identical implementation in `axios.ts` and `fetch.ts`) [[10]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-axios/templates/axios.ts) [[11]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-fetch/templates/fetch.ts):

```ts
export type UnwrapResult<T extends { data: unknown; error: unknown }> = 
  Extract<T, { error: undefined }>['data']

export type Unwrappable<T extends { data: unknown; error: unknown }> = 
  Promise<T> & { unwrap: () => Promise<UnwrapResult<T>> }

export function withUnwrap<T extends { data: unknown; error: unknown }>(
  promise: Promise<T>
): Unwrappable<T> {
  const unwrappable = promise as Unwrappable<T>
  unwrappable.unwrap = () =>
    promise.then((result) => {
      if (result.error !== undefined) throw result.error
      return result.data as UnwrapResult<T>
    })
  return unwrappable
}
```

`UnwrapResult<T>` uses the `error: undefined` discriminant to pick only success variants from the status-discriminated union. This ensures error results' `data: undefined` never pollutes the return type. `Unwrappable<T>` is a promise extended with the `.unwrap()` method. `withUnwrap(promise)` attaches `.unwrap()` to the resolved promise object at runtime; `.unwrap()` rejects if `result.error !== undefined`.

Generated operation functions wrap their call in `withUnwrap` instead of casting directly:

```ts
// Before
return request({ method: 'GET', url: '/pet/{petId}', ...config }) 
  as Promise<RequestResult<GetPetByIdResponses, ThrowOnError>>

// After
return withUnwrap(
  request({ method: 'GET', url: '/pet/{petId}', ...config })
) as Unwrappable<RequestResult<GetPetByIdResponses, ThrowOnError>>
```

### When unwrap() Rejects

With `throwOnError: false` and a non-2xx response, the result carries `error`, so `.unwrap()` throws it. With `throwOnError: true` (the default), errors throw before the promise resolves, so `.unwrap()` only ever sees a success result — it cannot reject due to an API error.

### Zero Configuration

This feature is purely additive. `await getPetById(...)` still resolves to the full `RequestResult`, so existing code is unaffected. No plugin option is required or available. Both standalone functions and SDK class methods support `.unwrap()` identically.

The query plugins (`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, `@kubb/plugin-mcp`) call the generated client internally and `await` it, so they see only the standard `RequestResult` and remain byte-for-byte unchanged.

## Complete Usage Examples

This section demonstrates all usage patterns for working with the generated client functions from `@kubb/plugin-axios` and `@kubb/plugin-fetch`, using the `getPetById` operation as a consistent example throughout.

### Using unwrap() — the simplest form

The `.unwrap()` method extracts just the success body from the result, eliminating the need to destructure the full `RequestResult` object.

```typescript
import { getPetById } from './gen/clients'

// Direct unwrap — returns just the Pet body
const pet = await getPetById({ path: { petId: 1 } }).unwrap()
console.log(pet.name) // 'Fluffy'
```

With the default `throwOnError: true` configuration, the promise resolves only for 2xx responses [[3]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-axios/templates/axios.ts#L69-L85). Errors throw as `ResponseError` before the promise resolves, so `.unwrap()` only sees success results and never rejects due to API errors.

### Using unwrap() with try/catch (default throwOnError: true)

When `throwOnError` is enabled (the default), errors throw as `ResponseError` rather than resolving to the error variant of `RequestResult`. [[2]](https://docs.kubb.dev/plugins/plugin-axios/guide/error-handling)

```typescript
import { getPetById, ResponseError } from './gen/clients'

try {
  const pet = await getPetById({ path: { petId: 1 } }).unwrap()
  console.log(pet.name)
} catch (error) {
  if (error instanceof ResponseError) {
    // Non-2xx response
    console.error('API error:', error.status, error.data)
  } else {
    // Network failure or other error
    console.error('Request failed:', error)
  }
}
```

With `throwOnError: true`, `.unwrap()` does not introduce any additional error handling — errors throw before the promise resolves, so `.unwrap()` only ever sees a success result.

### Manual error handling with throwOnError: false (without unwrap)

Setting `throwOnError: false` changes the behavior: non-2xx responses resolve to the full `RequestResult` with the `error` field populated instead of throwing. [[2]](https://docs.kubb.dev/plugins/plugin-axios/guide/error-handling)

```typescript
import { getPetById } from './gen/clients'

const result = await getPetById({ path: { petId: 1 }, throwOnError: false })

if (result.error !== undefined) {
  // Non-2xx response — error field is populated
  console.error('API returned error:', result.status, result.error)
} else {
  // 2xx response — data field is populated
  console.log(result.data.name)
}
```

The `error` property acts as a discriminant: when it is defined, TypeScript narrows the result to the error variants, and when it is `undefined`, TypeScript narrows to success variants [[5]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-axios/templates/axios.ts#L44-L53).

### Using unwrap() with throwOnError: false

With `throwOnError: false`, `.unwrap()` rejects when the result has an `error` field set, allowing structured error handling via try/catch.

```typescript
import { getPetById } from './gen/clients'

try {
  const pet = await getPetById({ path: { petId: 1 }, throwOnError: false }).unwrap()
  console.log(pet.name)
} catch (error) {
  // error is the parsed error body from the API (non-2xx response)
  console.error('API error:', error)
}
```

This differs from the default `throwOnError: true` behavior: with `throwOnError: false`, `.unwrap()` rejects with the parsed error body directly, not a `ResponseError` instance.

### SDK class usage

Class-based SDK methods return the same result type as standalone functions and support `.unwrap()` identically.

```typescript
import { PetClient } from './gen/clients'

const petClient = new PetClient({ baseURL: 'https://api.example.com' })

// Unwrap on class method — same as standalone function
const pet = await petClient.getPetById({ path: { petId: 1 } }).unwrap()
console.log(pet.name)
```

SDK class methods are generated by the SDK generator and use the same `withUnwrap` runtime helper as standalone functions, so `.unwrap()` is available identically on both.

### Comparison: full result vs unwrap

The full `RequestResult` provides all response metadata — status code, content type, and the underlying request/response objects [[3]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-axios/templates/axios.ts#L69-L85). `.unwrap()` discards this metadata and returns only the success body. Use the full result when you need the status or headers; use `.unwrap()` when you only care about the data.

```typescript
import { getPetById } from './gen/clients'

// Full result — all metadata available
const result = await getPetById({ path: { petId: 1 } })
console.log(result.status)       // 200
console.log(result.data.name)    // 'Fluffy'
console.log(result.contentType)  // 'application/json'

// Unwrapped — just the body
const pet = await getPetById({ path: { petId: 1 } }).unwrap()
console.log(pet.name)  // equivalent to result.data above
```

Both patterns are fully supported — `await getPetById(...)` still resolves to the full `RequestResult`, and nothing changes for callers not using `.unwrap()`.

## Relationship to Configuration Options

### unwrap() vs dataReturnType

The `dataReturnType` option (available on `@kubb/plugin-client`) is a **generation-time** setting. It changes the function's TypeScript signature: `'data'` makes the function return `Promise<ResponseConfig['data']>` directly — the response envelope is stripped from the type entirely. `'full'` returns the complete `ResponseConfig` object. [[12]](https://docs.kubb.dev/kubb/plugins/plugin-client) Note that `@kubb/plugin-axios` and `@kubb/plugin-fetch` use `RequestResult` directly rather than `ResponseConfig`, but the trade-off between generation-time and runtime access is the same.

`unwrap()` is different in every important way:

| | `dataReturnType` | `unwrap()` |
|---|---|---|
| **When it applies** | Generation time (config) | Runtime (call site) |
| **Opt-in required** | Yes — set in `kubb.config.ts` | No — always available |
| **Default behavior changed** | Yes — alters function signature | No — `await call()` unchanged |
| **Per-call control** | No | Yes — use `.unwrap()` where needed |
| **Full result still accessible** | No (with `'data'`) | Yes — `await call()` still works |

In practice, `unwrap()` lets you access the bare success body at the call site without changing the generated code's signature or configuration. If you want the body everywhere and never need the metadata (`status`, `contentType`, `request`, `response`), `dataReturnType: 'data'` is the generation-time alternative.

### Client support

Both `@kubb/plugin-axios` and `@kubb/plugin-fetch` ship identical `UnwrapResult`, `Unwrappable`, and `withUnwrap` implementations. There is no transport-specific difference in how `unwrap()` behaves.

### Query hooks are unaffected

The query-layer plugins — `@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-mcp` — all call the generated client functions internally and `await` the result promise. Because `Unwrappable<T>` extends `Promise<T>`, every existing `await` call continues to resolve to the full `RequestResult`. The generated query hooks are byte-for-byte unchanged by this addition.

## Type Safety Notes

### How RequestResult discriminates

`RequestResult` is a TypeScript discriminated union keyed on both the numeric `status` literal and the presence or absence of `error`. Success variants have `error: undefined`; error variants have `data: undefined`. TypeScript narrows the union correctly in `if` checks and `switch` statements:

```typescript
const result = await getPetById({ path: { petId: 1 }, throwOnError: false })

if (result.error) {
  // TypeScript knows: data is undefined, error is the typed error body
  console.error(result.error)
} else {
  // TypeScript knows: error is undefined, data is the typed success body
  console.log(result.data.name)
}
```

[[4]](https://github.com/kubb-labs/plugins/blob/fb58b8e4e196187eaefc57c776dc660c14c8b7a7/packages/plugin-axios/templates/axios.ts#L35-L53)

### How UnwrapResult extracts the success type

`UnwrapResult<T>` is defined as:

```typescript
type UnwrapResult<T extends { data: unknown; error: unknown }> =
  Extract<T, { error: undefined }>['data']
```

`Extract<T, { error: undefined }>` filters the union to only the success variants (those where `error` is `undefined`). Indexing with `['data']` then pulls the success body type. This means error results' `data: undefined` can never widen the inferred type — `UnwrapResult` is always the actual success body type, not `SuccessBody | undefined`.

### ThrowOnError flows through the signature

The `ThrowOnError` generic defaults to `true` and flows through the entire call chain:

```typescript
function getPetById<ThrowOnError extends boolean = true>(
  options: Options<GetPetByIdOptions, ThrowOnError>,
): Unwrappable<RequestResult<GetPetByIdResponses, ThrowOnError>>
```

TypeScript infers `ThrowOnError` from the value you pass, so the compiler knows at the call site whether the result can carry an error variant. With `throwOnError: true`, the return type is narrowed to success-only variants; with `throwOnError: false`, it includes all documented status variants.

### Generated types from plugin-ts and plugin-zod

The response record (`GetPetByIdResponses`, `AddPetResponses`, etc.) is generated by `@kubb/plugin-ts` or inferred from `@kubb/plugin-zod` schemas. These generated types flow directly into `RequestResult` and therefore into `UnwrapResult`, giving you compile-time accuracy for both the full result and the unwrapped body.
