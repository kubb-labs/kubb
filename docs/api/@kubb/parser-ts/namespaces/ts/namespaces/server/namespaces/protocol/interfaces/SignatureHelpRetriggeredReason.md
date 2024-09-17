[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / SignatureHelpRetriggeredReason

# SignatureHelpRetriggeredReason

Signals that this signature help request came from typing a character or moving the cursor.
This should only occur if a signature help session was already active and the editor needs to see if it should adjust.
The language service will unconditionally attempt to provide a result.
`triggerCharacter` can be `undefined` for a retrigger caused by a cursor move.

## Properties

### kind

```ts
kind: "retrigger";
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10275

***

### triggerCharacter?

```ts
optional triggerCharacter: SignatureHelpRetriggerCharacter;
```

Character that was responsible for triggering signature help.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10279
