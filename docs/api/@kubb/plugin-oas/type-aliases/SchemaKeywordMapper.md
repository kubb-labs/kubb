[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / SchemaKeywordMapper

# SchemaKeywordMapper

```ts
type SchemaKeywordMapper: object;
```

## Type declaration

### and

```ts
and: object;
```

### and.args

```ts
and.args: Schema[];
```

### and.keyword

```ts
and.keyword: "and";
```

### any

```ts
any: object;
```

### any.keyword

```ts
any.keyword: "any";
```

### array

```ts
array: object;
```

### array.args

```ts
array.args: object;
```

### array.args.items

```ts
array.args.items: Schema[];
```

### array.args.max?

```ts
optional array.args.max: number;
```

### array.args.min?

```ts
optional array.args.min: number;
```

### array.keyword

```ts
array.keyword: "array";
```

### blob

```ts
blob: object;
```

### blob.keyword

```ts
blob.keyword: "blob";
```

### boolean

```ts
boolean: object;
```

### boolean.keyword

```ts
boolean.keyword: "boolean";
```

### catchall

```ts
catchall: object;
```

### catchall.keyword

```ts
catchall.keyword: "catchall";
```

### const

```ts
const: object;
```

### const.args

```ts
const.args: object;
```

### const.args.format

```ts
const.args.format: "string" | "number";
```

### const.args.name

```ts
const.args.name: string | number;
```

### const.args.value?

```ts
optional const.args.value: string | number;
```

### const.keyword

```ts
const.keyword: "const";
```

### date

```ts
date: object;
```

### date.args

```ts
date.args: object;
```

### date.args.type?

```ts
optional date.args.type: "date" | "string";
```

### date.keyword

```ts
date.keyword: "date";
```

### datetime

```ts
datetime: object;
```

### datetime.args

```ts
datetime.args: object;
```

### datetime.args.local?

```ts
optional datetime.args.local: boolean;
```

### datetime.args.offset?

```ts
optional datetime.args.offset: boolean;
```

### datetime.keyword

```ts
datetime.keyword: "datetime";
```

### default

```ts
default: object;
```

### default.args

```ts
default.args: string | number | boolean;
```

### default.keyword

```ts
default.keyword: "default";
```

### deprecated

```ts
deprecated: object;
```

### deprecated.keyword

```ts
deprecated.keyword: "deprecated";
```

### describe

```ts
describe: object;
```

### describe.args

```ts
describe.args: string;
```

### describe.keyword

```ts
describe.keyword: "describe";
```

### email

```ts
email: object;
```

### email.keyword

```ts
email.keyword: "email";
```

### enum

```ts
enum: object;
```

### enum.args

```ts
enum.args: object;
```

### enum.args.asConst

```ts
enum.args.asConst: boolean;
```

### enum.args.items

```ts
enum.args.items: object[];
```

### enum.args.name

```ts
enum.args.name: string;
```

### enum.args.typeName

```ts
enum.args.typeName: string;
```

### enum.keyword

```ts
enum.keyword: "enum";
```

### example

```ts
example: object;
```

### example.args

```ts
example.args: string;
```

### example.keyword

```ts
example.keyword: "example";
```

### firstName

```ts
firstName: object;
```

### firstName.keyword

```ts
firstName.keyword: "firstName";
```

### integer

```ts
integer: object;
```

### integer.keyword

```ts
integer.keyword: "integer";
```

### lastName

```ts
lastName: object;
```

### lastName.keyword

```ts
lastName.keyword: "lastName";
```

### matches

```ts
matches: object;
```

### matches.args?

```ts
optional matches.args: string;
```

### matches.keyword

```ts
matches.keyword: "matches";
```

### max

```ts
max: object;
```

### max.args

```ts
max.args: number;
```

### max.keyword

```ts
max.keyword: "max";
```

### min

```ts
min: object;
```

### min.args

```ts
min.args: number;
```

### min.keyword

```ts
min.keyword: "min";
```

### name

```ts
name: object;
```

### name.args

```ts
name.args: string;
```

### name.keyword

```ts
name.keyword: "name";
```

### null

```ts
null: object;
```

### null.keyword

```ts
null.keyword: "null";
```

### nullable

```ts
nullable: object;
```

### nullable.keyword

```ts
nullable.keyword: "nullable";
```

### nullish

```ts
nullish: object;
```

### nullish.keyword

```ts
nullish.keyword: "nullish";
```

### number

```ts
number: object;
```

### number.keyword

```ts
number.keyword: "number";
```

### object

```ts
object: object;
```

### object.args

```ts
object.args: object;
```

### object.args.additionalProperties

```ts
object.args.additionalProperties: Schema[];
```

### object.args.properties

```ts
object.args.properties: object;
```

#### Index Signature

 \[`x`: `string`\]: [`Schema`](Schema.md)[]

### object.args.strict?

```ts
optional object.args.strict: boolean;
```

### object.keyword

```ts
object.keyword: "object";
```

### optional

```ts
optional: object;
```

### optional.keyword

```ts
optional.keyword: "optional";
```

### password

```ts
password: object;
```

### password.keyword

```ts
password.keyword: "password";
```

### phone

```ts
phone: object;
```

### phone.keyword

```ts
phone.keyword: "phone";
```

### readOnly

```ts
readOnly: object;
```

### readOnly.keyword

```ts
readOnly.keyword: "readOnly";
```

### ref

```ts
ref: object;
```

### ref.args

```ts
ref.args: object;
```

### ref.args.name

```ts
ref.args.name: string;
```

### ref.args.path

```ts
ref.args.path: KubbFile.OptionalPath;
```

### ref.keyword

```ts
ref.keyword: "ref";
```

### schema

```ts
schema: object;
```

### schema.args

```ts
schema.args: object;
```

### schema.args.format?

```ts
optional schema.args.format: string;
```

### schema.args.type

```ts
schema.args.type: 
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "array"
  | "object";
```

### schema.keyword

```ts
schema.keyword: "schema";
```

### strict

```ts
strict: object;
```

### strict.keyword

```ts
strict.keyword: "strict";
```

### string

```ts
string: object;
```

### string.keyword

```ts
string.keyword: "string";
```

### time

```ts
time: object;
```

### time.args

```ts
time.args: object;
```

### time.args.type?

```ts
optional time.args.type: "date" | "string";
```

### time.keyword

```ts
time.keyword: "time";
```

### tuple

```ts
tuple: object;
```

### tuple.args

```ts
tuple.args: object;
```

### tuple.args.items

```ts
tuple.args.items: Schema[];
```

### tuple.args.max?

```ts
optional tuple.args.max: number;
```

### tuple.args.min?

```ts
optional tuple.args.min: number;
```

### tuple.keyword

```ts
tuple.keyword: "tuple";
```

### undefined

```ts
undefined: object;
```

### undefined.keyword

```ts
undefined.keyword: "undefined";
```

### union

```ts
union: object;
```

### union.args

```ts
union.args: Schema[];
```

### union.keyword

```ts
union.keyword: "union";
```

### unknown

```ts
unknown: object;
```

### unknown.keyword

```ts
unknown.keyword: "unknown";
```

### url

```ts
url: object;
```

### url.keyword

```ts
url.keyword: "url";
```

### uuid

```ts
uuid: object;
```

### uuid.keyword

```ts
uuid.keyword: "uuid";
```

## Defined in

[plugin-oas/src/SchemaMapper.ts:3](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/plugin-oas/src/SchemaMapper.ts#L3)
