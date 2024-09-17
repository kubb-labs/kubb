[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ScriptElementKind

# ScriptElementKind

## Enumeration Members

### alias

```ts
alias: "alias";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11086

***

### callSignatureElement

```ts
callSignatureElement: "call";
```

interface Y { ():number; }

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11076

***

### classElement

```ts
classElement: "class";
```

class X {}

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11030

***

### constElement

```ts
constElement: "const";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11087

***

### constructorImplementationElement

```ts
constructorImplementationElement: "constructor";
```

class X { constructor() { } }
class X { static { } }

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11074

***

### constructSignatureElement

```ts
constructSignatureElement: "construct";
```

interface Y { new():Y; }

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11080

***

### directory

```ts
directory: "directory";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11089

***

### enumElement

```ts
enumElement: "enum";
```

enum E

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11038

***

### enumMemberElement

```ts
enumMemberElement: "enum member";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11039

***

### externalModuleName

```ts
externalModuleName: "external module name";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11090

***

### functionElement

```ts
functionElement: "function";
```

Inside module and script only
function f() { }

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11055

***

### indexSignatureElement

```ts
indexSignatureElement: "index";
```

interface Y { []:number; }

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11078

***

### interfaceElement

```ts
interfaceElement: "interface";
```

interface Y {}

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11034

***

### ~~jsxAttribute~~

```ts
jsxAttribute: "JSX attribute";
```

<JsxTagName attribute1 attribute2={0} />

#### Deprecated

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11095

***

### keyword

```ts
keyword: "keyword";
```

predefined type (void) or keyword (class)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11024

***

### label

```ts
label: "label";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11085

***

### letElement

```ts
letElement: "let";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11088

***

### link

```ts
link: "link";
```

Jsdoc @link: in `{@link C link text}`, the before and after text "" and ""

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11099

***

### linkName

```ts
linkName: "link name";
```

Jsdoc @link: in `{@link C link text}`, the entity name "C"

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11101

***

### linkText

```ts
linkText: "link text";
```

Jsdoc @link: in `{@link C link text}`, the link text "link text"

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11103

***

### localClassElement

```ts
localClassElement: "local class";
```

var x = class X {}

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11032

***

### localFunctionElement

```ts
localFunctionElement: "local function";
```

Inside function

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11057

***

### localVariableElement

```ts
localVariableElement: "local var";
```

Inside function

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11046

***

### memberAccessorVariableElement

```ts
memberAccessorVariableElement: "accessor";
```

class X { [public|private]* accessor foo: number; }

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11069

***

### memberFunctionElement

```ts
memberFunctionElement: "method";
```

class X { [public|private]* foo() {} }

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11059

***

### memberGetAccessorElement

```ts
memberGetAccessorElement: "getter";
```

class X { [public|private]* [get|set] foo:number; }

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11061

***

### memberSetAccessorElement

```ts
memberSetAccessorElement: "setter";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11062

***

### memberVariableElement

```ts
memberVariableElement: "property";
```

class X { [public|private]* foo:number; }
interface Y { foo:number; }

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11067

***

### moduleElement

```ts
moduleElement: "module";
```

module foo {}

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11028

***

### parameterElement

```ts
parameterElement: "parameter";
```

function foo(*Y*: string)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11082

***

### primitiveType

```ts
primitiveType: "primitive type";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11084

***

### scriptElement

```ts
scriptElement: "script";
```

top level script node

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11026

***

### string

```ts
string: "string";
```

String literal

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11097

***

### typeElement

```ts
typeElement: "type";
```

type T = ...

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11036

***

### typeParameterElement

```ts
typeParameterElement: "type parameter";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11083

***

### unknown

```ts
unknown: "";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11021

***

### variableAwaitUsingElement

```ts
variableAwaitUsingElement: "await using";
```

await using foo = ...

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11050

***

### variableElement

```ts
variableElement: "var";
```

Inside module and script only
const v = ..

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11044

***

### variableUsingElement

```ts
variableUsingElement: "using";
```

using foo = ...

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11048

***

### warning

```ts
warning: "warning";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11022
