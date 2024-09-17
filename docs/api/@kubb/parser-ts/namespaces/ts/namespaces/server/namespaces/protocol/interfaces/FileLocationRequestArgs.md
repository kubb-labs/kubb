[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / FileLocationRequestArgs

# FileLocationRequestArgs

Instances of this interface specify a location in a source file:
(file, line, character offset), where line and character offset are 1-based.

## Extends

- [`FileRequestArgs`](FileRequestArgs.md)

## Extended by

- [`SpanOfEnclosingCommentRequestArgs`](SpanOfEnclosingCommentRequestArgs.md)
- [`IndentationRequestArgs`](IndentationRequestArgs.md)
- [`DocumentHighlightsRequestArgs`](DocumentHighlightsRequestArgs.md)
- [`BraceCompletionRequestArgs`](BraceCompletionRequestArgs.md)
- [`JsxClosingTagRequestArgs`](JsxClosingTagRequestArgs.md)
- [`RenameRequestArgs`](RenameRequestArgs.md)
- [`FormatRequestArgs`](FormatRequestArgs.md)
- [`FormatOnKeyRequestArgs`](FormatOnKeyRequestArgs.md)
- [`CompletionsRequestArgs`](CompletionsRequestArgs.md)
- [`CompletionDetailsRequestArgs`](CompletionDetailsRequestArgs.md)
- [`SignatureHelpRequestArgs`](SignatureHelpRequestArgs.md)

## Properties

### file

```ts
file: string;
```

The file for the request (absolute pathname required).

#### Inherited from

[`FileRequestArgs`](FileRequestArgs.md).[`file`](FileRequestArgs.md#file)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:241

***

### line

```ts
line: number;
```

The line number for the request (1-based).

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:445

***

### offset

```ts
offset: number;
```

The character offset (on the line) for the request (1-based).

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:449

***

### projectFileName?

```ts
optional projectFileName: string;
```

#### Inherited from

[`FileRequestArgs`](FileRequestArgs.md).[`projectFileName`](FileRequestArgs.md#projectfilename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:242
