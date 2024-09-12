[API](../../../packages.md) / [@kubb/oas](../index.md) / Operation

# Operation

## Constructors

### new Operation()

```ts
new Operation(
   api, 
   path, 
   method, 
   operation): Operation
```

#### Parameters

• **api**: [`OASDocument`](../namespaces/OasTypes/type-aliases/OASDocument.md)

• **path**: `string`

• **method**: [`HttpMethod`](../type-aliases/HttpMethod.md)

• **operation**: [`OperationObject`](../namespaces/OasTypes/type-aliases/OperationObject.md)

#### Returns

[`Operation`](Operation.md)

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:185

## Properties

### api

```ts
api: OASDocument;
```

OpenAPI API Definition that this operation originated from.

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:149

***

### callbackExamples

```ts
callbackExamples: CallbackExamples;
```

Callback examples for this operation (if it has callbacks).

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:177

***

### contentType

```ts
contentType: string;
```

The primary Content Type that this operation accepts.

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:161

***

### exampleGroups

```ts
exampleGroups: ExampleGroups;
```

An object with groups of all example definitions (body/header/query/path/response/etc.)

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:165

***

### headers

```ts
headers: object;
```

Flattened out arrays of both request and response headers that are utilized on this operation.

#### request

```ts
request: string[];
```

#### response

```ts
response: string[];
```

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:181

***

### method

```ts
method: HttpMethod;
```

HTTP Method that this operation is targeted towards.

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:157

***

### path

```ts
path: string;
```

Path that this operation is targeted towards.

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:153

***

### requestBodyExamples

```ts
requestBodyExamples: RequestBodyExamples;
```

Request body examples for this operation.

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:169

***

### responseExamples

```ts
responseExamples: ResponseExamples;
```

Response examples for this operation.

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:173

***

### schema

```ts
schema: OperationObject;
```

Schema of the operation from the API Definition.

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:145

## Methods

### getCallback()

```ts
getCallback(
   identifier, 
   expression, 
   method): false | Callback
```

Retrieve a specific callback.

#### Parameters

• **identifier**: `string`

Callback identifier to look for.

• **expression**: `string`

Callback expression to look for.

• **method**: [`HttpMethod`](../type-aliases/HttpMethod.md)

HTTP Method on the callback to look for.

#### Returns

`false` \| `Callback`

#### See

 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#callbackObject](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#callbackObject)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#callbackObject](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#callbackObject)

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:380

***

### getCallbackExamples()

```ts
getCallbackExamples(): CallbackExamples
```

Retrieve an array of callback examples that this operation has.

#### Returns

`CallbackExamples`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:390

***

### getCallbacks()

```ts
getCallbacks(): false | (false | Callback)[]
```

Retrieve an array of operations created from each callback.

#### Returns

`false` \| (`false` \| `Callback`)[]

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:385

***

### getContentType()

```ts
getContentType(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:188

***

### getDescription()

```ts
getDescription(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:187

***

### getExampleGroups()

```ts
getExampleGroups(): ExampleGroups
```

Returns an object with groups of all example definitions (body/header/query/path/response/etc.).
The examples are grouped by their key when defined via the `examples` map.

Any custom code samples defined via the `x-readme.code-samples` extension are returned,
regardless of if they have a matching response example.

For standard OAS request parameter (e.g., body/header/query/path/etc.) examples,
they are only present in the return object if they have a corresponding response example
(i.e., a response example with the same key in the `examples` map).

#### Returns

`ExampleGroups`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:420

***

### ~~getExtension()~~

```ts
getExtension(extension): unknown
```

Retrieve a custom specification extension off of the operation.

#### Parameters

• **extension**: `string`

Specification extension to lookup.

#### Returns

`unknown`

#### See

 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#specificationExtensions](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#specificationExtensions)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#specificationExtensions](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#specificationExtensions)

#### Deprecated

Use `oas.getExtension(extension, operation)` instead.

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:408

***

### getHeaders()

```ts
getHeaders(): object
```

#### Returns

`object`

##### request

```ts
request: string[];
```

##### response

```ts
response: string[];
```

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:225

***

### getOperationId()

```ts
getOperationId(opts?): string
```

Get an `operationId` for this operation. If one is not present (it's not required by the spec!)
a hash of the path and method will be returned instead.

#### Parameters

• **opts?**

• **opts.camelCase?**: `boolean`

Generate a JS method-friendly operation ID when one isn't present.

For backwards compatiblity reasons this option will be indefinitely supported however we
recommend using `friendlyCase` instead as it's a heavily improved version of this option.

**See**

**Deprecated**

• **opts.friendlyCase?**: `boolean`

Generate a human-friendly, but still camelCase, operation ID when one isn't present. The
difference between this and `camelCase` is that this also ensure that consecutive words are
not present in the resulting ID. For example, for the endpoint `/candidate/{candidate}` will
return `getCandidateCandidate` for `camelCase` however `friendlyCase` will return
`getCandidate`.

The reason this friendliness is just not a part of the `camelCase` option is because we have
a number of consumers of the old operation ID style and making that change there would a
breaking change that we don't have any easy way to resolve.

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:237

***

### getParameters()

```ts
getParameters(): ParameterObject[]
```

Return the parameters (non-request body) on the operation.

#### Returns

[`ParameterObject`](../namespaces/OasTypes/type-aliases/ParameterObject.md)[]

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:280

***

### getParametersAsJSONSchema()

```ts
getParametersAsJSONSchema(opts?): SchemaWrapper[]
```

Convert the operation into an array of JSON Schema schemas for each available type of
parameter available on the operation.

#### Parameters

• **opts?**: `getParametersAsJSONSchemaOptions`

#### Returns

`SchemaWrapper`[]

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:291

***

### getRequestBody()

```ts
getRequestBody(mediaType?): false | MediaTypeObject | [string, MediaTypeObject, ...string[]]
```

Retrieve a specific request body content schema off this operation.

If no media type is supplied this will return either the first available JSON-like request
body, or the first available if there are no JSON-like media types present. When this return
comes back it's in the form of an array with the first key being the selected media type,
followed by the media type object in question.

#### Parameters

• **mediaType?**: `string`

Specific request body media type to retrieve if present.

#### Returns

`false` \| [`MediaTypeObject`](../namespaces/OasTypes/type-aliases/MediaTypeObject.md) \| [`string`, [`MediaTypeObject`](../namespaces/OasTypes/type-aliases/MediaTypeObject.md), `...string[]`]

#### See

 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#mediaTypeObject](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#mediaTypeObject)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#mediaTypeObject](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#mediaTypeObject)

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:349

***

### getRequestBodyExamples()

```ts
getRequestBodyExamples(): RequestBodyExamples
```

Retrieve an array of request body examples that this operation has.

#### Returns

`RequestBodyExamples`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:354

***

### getRequestBodyMediaTypes()

```ts
getRequestBodyMediaTypes(): string[]
```

Retrieve the list of all available media types that the operations request body can accept.

#### Returns

`string`[]

#### See

 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#mediaTypeObject](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#mediaTypeObject)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#mediaTypeObject](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#mediaTypeObject)

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:331

***

### getResponseAsJSONSchema()

```ts
getResponseAsJSONSchema(statusCode, opts?): object[]
```

Get a single response for this status code, formatted as JSON schema.

#### Parameters

• **statusCode**: `string` \| `number`

Status code to pull a JSON Schema response for.

• **opts?**

• **opts.includeDiscriminatorMappingRefs?**: `boolean`

If you wish to include discriminator mapping `$ref` components alongside your
`discriminator` in schemas. Defaults to `true`.

• **opts.transformer?**

With a transformer you can transform any data within a given schema, like say if you want
to rewrite a potentially unsafe `title` that might be eventually used as a JS variable
name, just make sure to return your transformed schema.

#### Returns

`object`[]

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:297

***

### getResponseByStatusCode()

```ts
getResponseByStatusCode(statusCode): boolean | ResponseObject
```

Return a specific response out of the operation by a given HTTP status code.

#### Parameters

• **statusCode**: `string` \| `number`

Status code to pull a response object for.

#### Returns

`boolean` \| [`ResponseObject`](../namespaces/OasTypes/type-aliases/ResponseObject.md)

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:360

***

### getResponseExamples()

```ts
getResponseExamples(): ResponseExamples
```

Retrieve an array of response examples that this operation has.

#### Returns

`ResponseExamples`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:365

***

### getResponseStatusCodes()

```ts
getResponseStatusCodes(): string[]
```

Get an array of all valid response status codes for this operation.

#### Returns

`string`[]

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:319

***

### getSecurity()

```ts
getSecurity(): SecurityRequirementObject[]
```

Returns an array of all security requirements associated wtih this operation. If none are
defined at the operation level, the securities for the entire API definition are returned
(with an empty array as a final fallback).

#### Returns

[`SecurityRequirementObject`](../namespaces/OpenAPIV3/interfaces/SecurityRequirementObject.md)[]

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:204

***

### getSecurityWithTypes()

```ts
getSecurityWithTypes(filterInvalid?): (false | (false | object)[])[]
```

Retrieve a collection of grouped security schemes. The inner array determines AND-grouped
security schemes, the outer array determines OR-groups.

#### Parameters

• **filterInvalid?**: `boolean`

Optional flag that, when set to `true`, filters out invalid/nonexistent
   security schemes, rather than returning `false`.

#### Returns

(`false` \| (`false` \| `object`)[])[]

#### See

 - [https://swagger.io/docs/specification/authentication/#multiple](https://swagger.io/docs/specification/authentication/#multiple)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#security-requirement-object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#security-requirement-object)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#securityRequirementObject](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#securityRequirementObject)

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:215

***

### getSummary()

```ts
getSummary(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:186

***

### getTags()

```ts
getTags(): TagObject[]
```

Return an array of all tags, and their metadata, that exist on this operation.

#### Returns

[`TagObject`](../namespaces/OpenAPIV3/interfaces/TagObject.md)[]

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:265

***

### hasCallbacks()

```ts
hasCallbacks(): boolean
```

Determine if the operation has callbacks.

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:370

***

### hasExtension()

```ts
hasExtension(extension): boolean
```

Determine if a given a custom specification extension exists within the operation.

#### Parameters

• **extension**: `string`

Specification extension to lookup.

#### Returns

`boolean`

#### See

 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#specificationExtensions](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#specificationExtensions)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#specificationExtensions](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#specificationExtensions)

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:398

***

### hasOperationId()

```ts
hasOperationId(): boolean
```

Determine if the operation has an operation present in its schema. Note that if one is present
in the schema but is an empty string then this will return false.

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:231

***

### hasParameters()

```ts
hasParameters(): boolean
```

Determine if the operation has any (non-request body) parameters.

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:275

***

### hasRequestBody()

```ts
hasRequestBody(): boolean
```

Determine if the operation has any request bodies.

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:324

***

### hasRequiredParameters()

```ts
hasRequiredParameters(): boolean
```

Determine if this operation has any required parameters.

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:285

***

### hasRequiredRequestBody()

```ts
hasRequiredRequestBody(): boolean
```

Determine if this operation has a required request body.

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:336

***

### isDeprecated()

```ts
isDeprecated(): boolean
```

Return is the operation is flagged as `deprecated` or not.

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:270

***

### isFormUrlEncoded()

```ts
isFormUrlEncoded(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:189

***

### isJson()

```ts
isJson(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:191

***

### isMultipart()

```ts
isMultipart(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:190

***

### isWebhook()

```ts
isWebhook(): boolean
```

Checks if the current operation is a webhook or not.

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:197

***

### isXml()

```ts
isXml(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:192

***

### prepareSecurity()

```ts
prepareSecurity(): Record<SecurityType, KeyedSecuritySchemeObject[]>
```

Retrieve an object where the keys are unique scheme types, and the values are arrays
containing each security scheme of that type.

#### Returns

`Record`\<[`SecurityType`](../namespaces/OasTypes/type-aliases/SecurityType.md), [`KeyedSecuritySchemeObject`](../namespaces/OasTypes/type-aliases/KeyedSecuritySchemeObject.md)[]\>

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/extensions-pEeRZhXP.d.ts:224
