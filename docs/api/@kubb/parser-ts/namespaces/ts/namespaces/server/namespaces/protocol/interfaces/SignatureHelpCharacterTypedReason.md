[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / SignatureHelpCharacterTypedReason

# SignatureHelpCharacterTypedReason

Signals that the signature help request came from a user typing a character.
Depending on the character and the syntactic context, the request may or may not be served a result.

## Properties

### kind

```ts
kind: "characterTyped";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10262

***

### triggerCharacter

```ts
triggerCharacter: SignatureHelpTriggerCharacter;
```

Character that was responsible for triggering signature help.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10266
