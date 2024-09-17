[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / SetCompilerOptionsForInferredProjectsRequest

# SetCompilerOptionsForInferredProjectsRequest

Request to set compiler options for inferred projects.
External projects are opened / closed explicitly.
Configured projects are opened when user opens loose file that has 'tsconfig.json' or 'jsconfig.json' anywhere in one of containing folders.
This configuration file will be used to obtain a list of files and configuration settings for the project.
Inferred projects are created when user opens a loose file that is not the part of external project
or configured project and will contain only open file and transitive closure of referenced files if 'useOneInferredProject' is false,
or all open loose files and its transitive closure of referenced files if 'useOneInferredProject' is true.

## Extends

- [`Request`](Request.md)

## Properties

### arguments

```ts
arguments: SetCompilerOptionsForInferredProjectsArgs;
```

Object containing arguments for the command

#### Overrides

[`Request`](Request.md).[`arguments`](Request.md#arguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1340

***

### command

```ts
command: CompilerOptionsForInferredProjects;
```

The command to execute

#### Overrides

[`Request`](Request.md).[`command`](Request.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1339

***

### seq

```ts
seq: number;
```

Sequence number of the message

#### Inherited from

[`Request`](Request.md).[`seq`](Request.md#seq)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:133

***

### type

```ts
type: "request";
```

One of "request", "response", or "event"

#### Inherited from

[`Request`](Request.md).[`type`](Request.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:143
