[API](../../../packages.md) / [@kubb/oas](../index.md) / Oas

# Oas\<TOAS\>

## Extends

- `Oas`

## Type Parameters

• **TOAS** = `unknown`

## Constructors

### new Oas()

```ts
new Oas<TOAS>(__namedParameters, options): Oas<TOAS>
```

#### Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.oas**: `string` \| [`OASDocument`](../namespaces/OasTypes/type-aliases/OASDocument.md) \| `TOAS`

• **\_\_namedParameters.user?**: [`User`](../namespaces/OasTypes/interfaces/User.md)

• **options**: `Options` = `{}`

#### Returns

[`Oas`](Oas.md)\<`TOAS`\>

#### Overrides

`BaseOas.constructor`

#### Defined in

[packages/oas/src/Oas.ts:19](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/oas/src/Oas.ts#L19)

## Properties

### api

```ts
api: OASDocument;
```

An OpenAPI API Definition.

#### Inherited from

`BaseOas.api`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:23

***

### dereferencing

```ts
protected dereferencing: object;
```

Internal storage array that the library utilizes to keep track of its `dereferencing` state so
it doesn't initiate multiple dereferencing processes.

#### circularRefs

```ts
circularRefs: string[];
```

#### complete

```ts
complete: boolean;
```

#### processing

```ts
processing: boolean;
```

#### Inherited from

`BaseOas.dereferencing`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:41

***

### document

```ts
document: TOAS;
```

#### Defined in

[packages/oas/src/Oas.ts:17](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/oas/src/Oas.ts#L17)

***

### promises

```ts
protected promises: object[];
```

Internal storage array that the library utilizes to keep track of the times the
{@see Oas.dereference} has been called so that if you initiate multiple promises they'll all
end up returning the same data set once the initial dereference call completed.

#### Inherited from

`BaseOas.promises`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:33

***

### user

```ts
user: User;
```

The current user that we should use when pulling auth tokens from security schemes.

#### Inherited from

`BaseOas.user`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:27

## Methods

### defaultVariables()

```ts
defaultVariables(selected?): ServerVariable
```

#### Parameters

• **selected?**: `number`

#### Returns

[`ServerVariable`](../namespaces/OasTypes/type-aliases/ServerVariable.md)

#### Inherited from

`BaseOas.defaultVariables`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:75

***

### dereference()

```ts
dereference(opts?): Promise<unknown>
```

Dereference the current OAS definition so it can be parsed free of worries of `$ref` schemas
and circular structures.

#### Parameters

• **opts?**

• **opts.preserveRefAsJSONSchemaTitle?**: `boolean`

Preserve component schema names within themselves as a `title`.

#### Returns

`Promise`\<`unknown`\>

#### Inherited from

`BaseOas.dereference`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:275

***

### dereferenceWithRef()

```ts
dereferenceWithRef(schema?): any
```

#### Parameters

• **schema?**: `unknown`

#### Returns

`any`

#### Defined in

[packages/oas/src/Oas.ts:30](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/oas/src/Oas.ts#L30)

***

### findOperation()

```ts
findOperation(url, method): PathMatch
```

Discover an operation in an OAS from a fully-formed URL and HTTP method. Will return an object
containing a `url` object and another one for `operation`. This differs from `getOperation()`
in that it does not return an instance of the `Operation` class.

#### Parameters

• **url**: `string`

A full URL to look up.

• **method**: [`HttpMethod`](../type-aliases/HttpMethod.md)

The cooresponding HTTP method to look up.

#### Returns

`PathMatch`

#### Inherited from

`BaseOas.findOperation`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:162

***

### findOperationMatches()

```ts
findOperationMatches(url): PathMatches
```

#### Parameters

• **url**: `string`

#### Returns

`PathMatches`

#### Inherited from

`BaseOas.findOperationMatches`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:153

***

### findOperationWithoutMethod()

```ts
findOperationWithoutMethod(url): PathMatch
```

Discover an operation in an OAS from a fully-formed URL without an HTTP method. Will return an
object containing a `url` object and another one for `operation`.

#### Parameters

• **url**: `string`

A full URL to look up.

#### Returns

`PathMatch`

#### Inherited from

`BaseOas.findOperationWithoutMethod`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:169

***

### getAuth()

```ts
getAuth(user, selectedApp?): object
```

With an object of user information, retrieve the appropriate API auth keys from the current
OAS definition.

#### Parameters

• **user**: [`User`](../namespaces/OasTypes/interfaces/User.md)

User

• **selectedApp?**: `string` \| `number`

The user app to retrieve an auth key for.

#### Returns

`object`

#### See

[https://docs.readme.com/docs/passing-data-to-jwt](https://docs.readme.com/docs/passing-data-to-jwt)

#### Inherited from

`BaseOas.getAuth`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:200

***

### getCircularReferences()

```ts
getCircularReferences(): string[]
```

Retrieve any circular `$ref` pointers that maybe present within the API definition.

This method requires that you first dereference the definition.

#### Returns

`string`[]

#### See

Oas.dereference

#### Inherited from

`BaseOas.getCircularReferences`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:269

***

### getDefinition()

```ts
getDefinition(): OASDocument
```

Retrieve the current OpenAPI API Definition.

#### Returns

[`OASDocument`](../namespaces/OasTypes/type-aliases/OASDocument.md)

#### Inherited from

`BaseOas.getDefinition`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:70

***

### getExtension()

```ts
getExtension(extension, operation?): unknown
```

Retrieve a custom specification extension off of the API definition.

#### Parameters

• **extension**: `string`

Specification extension to lookup.

• **operation?**: [`Operation`](Operation.md)

#### Returns

`unknown`

#### See

 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#specificationExtensions](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#specificationExtensions)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#specificationExtensions](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#specificationExtensions)

#### Inherited from

`BaseOas.getExtension`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:243

***

### getOperation()

```ts
getOperation(url, method): Operation
```

Retrieve an operation in an OAS from a fully-formed URL and HTTP method. Differs from
`findOperation` in that while this method will return an `Operation` instance,
`findOperation()` does not.

#### Parameters

• **url**: `string`

A full URL to look up.

• **method**: [`HttpMethod`](../type-aliases/HttpMethod.md)

The cooresponding HTTP method to look up.

#### Returns

[`Operation`](Operation.md)

#### Inherited from

`BaseOas.getOperation`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:178

***

### getOperationById()

```ts
getOperationById(id): Operation | Webhook
```

Retrieve an operation in an OAS by an `operationId`.

If an operation does not have an `operationId` one will be generated in place, using the
default behavior of `Operation.getOperationId()`, and then asserted against your query.

Note that because `operationId`s are unique that uniqueness does include casing so the ID
you are looking for will be asserted as an exact match.

#### Parameters

• **id**: `string`

The `operationId` to look up.

#### Returns

[`Operation`](Operation.md) \| `Webhook`

#### See

#### Inherited from

`BaseOas.getOperationById`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:191

***

### getParametersSchema()

```ts
getParametersSchema(operation, inKey): null | SchemaObject
```

#### Parameters

• **operation**: [`Operation`](Operation.md)

• **inKey**: `"path"` \| `"query"` \| `"header"`

#### Returns

`null` \| [`SchemaObject`](../namespaces/OasTypes/type-aliases/SchemaObject.md)

#### Defined in

[packages/oas/src/Oas.ts:153](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/oas/src/Oas.ts#L153)

***

### getPaths()

```ts
getPaths(): Record<string, Record<HttpMethod, Operation | Webhook>>
```

Returns the `paths` object that exists in this API definition but with every `method` mapped
to an instance of the `Operation` class.

#### Returns

`Record`\<`string`, `Record`\<[`HttpMethod`](../type-aliases/HttpMethod.md), [`Operation`](Operation.md) \| `Webhook`\>\>

#### See

 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.0.md#oasObject](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.0.md#oasObject)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#openapi-object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#openapi-object)

#### Inherited from

`BaseOas.getPaths`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:210

***

### getRequestSchema()

```ts
getRequestSchema(operation): undefined | SchemaObject
```

#### Parameters

• **operation**: [`Operation`](Operation.md)

#### Returns

`undefined` \| [`SchemaObject`](../namespaces/OasTypes/type-aliases/SchemaObject.md)

#### Defined in

[packages/oas/src/Oas.ts:131](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/oas/src/Oas.ts#L131)

***

### getResponseSchema()

```ts
getResponseSchema(operation, statusCode): SchemaObject
```

#### Parameters

• **operation**: [`Operation`](Operation.md)

• **statusCode**: `string` \| `number`

#### Returns

[`SchemaObject`](../namespaces/OasTypes/type-aliases/SchemaObject.md)

#### Defined in

[packages/oas/src/Oas.ts:98](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/oas/src/Oas.ts#L98)

***

### getTags()

```ts
getTags(setIfMissing?): string[]
```

Return an array of all tag names that exist on this API definition.

#### Parameters

• **setIfMissing?**: `boolean`

If a tag is not present on an operation that operations path will be added
   into the list of tags returned.

#### Returns

`string`[]

#### See

 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.0.md#oasObject](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.0.md#oasObject)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#openapi-object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#openapi-object)

#### Inherited from

`BaseOas.getTags`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:227

***

### getVersion()

```ts
getVersion(): string
```

Retrieve the OpenAPI version that this API definition is targeted for.

#### Returns

`string`

#### Inherited from

`BaseOas.getVersion`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:65

***

### getWebhooks()

```ts
getWebhooks(): Record<string, Record<HttpMethod, Webhook>>
```

Returns the `webhooks` object that exists in this API definition but with every `method`
mapped to an instance of the `Webhook` class.

#### Returns

`Record`\<`string`, `Record`\<[`HttpMethod`](../type-aliases/HttpMethod.md), `Webhook`\>\>

#### See

 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.0.md#oasObject](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.0.md#oasObject)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#openapi-object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#openapi-object)

#### Inherited from

`BaseOas.getWebhooks`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:218

***

### hasExtension()

```ts
hasExtension(extension): boolean
```

Determine if a given a custom specification extension exists within the API definition.

#### Parameters

• **extension**: `string`

Specification extension to lookup.

#### Returns

`boolean`

#### See

 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#specificationExtensions](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#specificationExtensions)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#specificationExtensions](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#specificationExtensions)

#### Inherited from

`BaseOas.hasExtension`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:235

***

### operation()

```ts
operation(
   path, 
   method, 
   opts?): Operation
```

Retrieve an Operation of Webhook class instance for a given path and method.

#### Parameters

• **path**: `string`

Path to lookup and retrieve.

• **method**: [`HttpMethod`](../type-aliases/HttpMethod.md)

HTTP Method to retrieve on the path.

• **opts?**

• **opts.isWebhook?**: `boolean`

If you prefer to first look for a webhook with this path and method.

#### Returns

[`Operation`](Operation.md)

#### Inherited from

`BaseOas.operation`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:147

***

### replaceUrl()

```ts
replaceUrl(url, variables?): string
```

Replace templated variables with supplied data in a given URL.

There are a couple ways that this will utilize variable data:

 - Supplying a `variables` object. If this is supplied, this data will always take priority.
   This incoming `variables` object can be two formats:
   `{ variableName: { default: 'value' } }` and `{ variableName: 'value' }`. If the former is
   present, that will take precedence over the latter.
 - If the supplied `variables` object is empty or does not match the current template name,
   we fallback to the data stored in `this.user` and attempt to match against that.
   See `getUserVariable` for some more information on how this data is pulled from `this.user`.

If no variables supplied match up with the template name, the template name will instead be
used as the variable data.

#### Parameters

• **url**: `string`

A URL to swap variables into.

• **variables?**: [`ServerVariable`](../namespaces/OasTypes/type-aliases/ServerVariable.md)

An object containing variables to swap into the URL.

#### Returns

`string`

#### Inherited from

`BaseOas.replaceUrl`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:140

***

### splitUrl()

```ts
splitUrl(selected?): (object | object)[]
```

#### Parameters

• **selected?**: `number`

#### Returns

(`object` \| `object`)[]

#### Inherited from

`BaseOas.splitUrl`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:76

***

### splitVariables()

```ts
splitVariables(baseUrl): false | object
```

With a fully composed server URL, run through our list of known OAS servers and return back
which server URL was selected along with any contained server variables split out.

For example, if you have an OAS server URL of `https://{name}.example.com:{port}/{basePath}`,
and pass in `https://buster.example.com:3000/pet` to this function, you'll get back the
following:

   { selected: 0, variables: { name: 'buster', port: 3000, basePath: 'pet' } }

Re-supplying this data to `oas.url()` should return the same URL you passed into this method.

#### Parameters

• **baseUrl**: `string`

A given URL to extract server variables out of.

#### Returns

`false` \| `object`

#### Inherited from

`BaseOas.splitVariables`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:117

***

### url()

```ts
url(selected?, variables?): string
```

#### Parameters

• **selected?**: `number`

• **variables?**: [`ServerVariable`](../namespaces/OasTypes/type-aliases/ServerVariable.md)

#### Returns

`string`

#### Inherited from

`BaseOas.url`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:71

***

### valdiate()

```ts
valdiate(): Promise<void>
```

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/oas/src/Oas.ts:190](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/oas/src/Oas.ts#L190)

***

### validateExtension()

```ts
validateExtension(extension): void
```

Determine if a given OpenAPI custom extension is valid or not.

#### Parameters

• **extension**: keyof `Extensions`

Specification extension to validate.

#### Returns

`void`

#### See

 - [https://docs.readme.com/docs/openapi-extensions](https://docs.readme.com/docs/openapi-extensions)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#specificationExtensions](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#specificationExtensions)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#specificationExtensions](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#specificationExtensions)

#### Throws

#### Inherited from

`BaseOas.validateExtension`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:253

***

### validateExtensions()

```ts
validateExtensions(): void
```

Validate all of our custom or known OpenAPI extensions, throwing exceptions when necessary.

#### Returns

`void`

#### See

 - [https://docs.readme.com/docs/openapi-extensions](https://docs.readme.com/docs/openapi-extensions)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#specificationExtensions](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#specificationExtensions)
 - [https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#specificationExtensions](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#specificationExtensions)

#### Inherited from

`BaseOas.validateExtensions`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:261

***

### variables()

```ts
variables(selected?): object
```

#### Parameters

• **selected?**: `number`

#### Returns

`object`

#### Inherited from

`BaseOas.variables`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:72

***

### init()

```ts
static init(oas, user?): Oas
```

This will initialize a new instance of the `Oas` class. This method is useful if you're using
Typescript and are attempting to supply an untyped JSON object into `Oas` as it will force-type
that object to an `OASDocument` for you.

#### Parameters

• **oas**: `Record`\<`string`, `unknown`\> \| [`OASDocument`](../namespaces/OasTypes/type-aliases/OASDocument.md)

An OpenAPI definition.

• **user?**: [`User`](../namespaces/OasTypes/interfaces/User.md)

The information about a user that we should use when pulling auth tokens from
   security schemes.

#### Returns

`Oas`

#### Inherited from

`BaseOas.init`

#### Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/index.d.ts:61
