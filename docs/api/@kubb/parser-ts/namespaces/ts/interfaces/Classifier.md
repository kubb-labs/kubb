[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / Classifier

# Classifier

## Methods

### ~~getClassificationsForLine()~~

```ts
getClassificationsForLine(
   text, 
   lexState, 
   syntacticClassifierAbsent): ClassificationResult
```

Gives lexical classifications of tokens on a line without any syntactic context.
For instance, a token consisting of the text 'string' can be either an identifier
named 'string' or the keyword 'string', however, because this classifier is not aware,
it relies on certain heuristics to give acceptable results. For classifications where
speed trumps accuracy, this function is preferable; however, for true accuracy, the
syntactic classifier is ideal. In fact, in certain editing scenarios, combining the
lexical, syntactic, and semantic classifiers may issue the best user experience.

#### Parameters

• **text**: `string`

The text of a line to classify.

• **lexState**: [`EndOfLineState`](../enumerations/EndOfLineState.md)

The state of the lexical classifier at the end of the previous line.

• **syntacticClassifierAbsent**: `boolean`

Whether the client is *not* using a syntactic classifier.
                                 If there is no syntactic classifier (syntacticClassifierAbsent=true),
                                 certain heuristics may be used in its place; however, if there is a
                                 syntactic classifier (syntacticClassifierAbsent=false), certain
                                 classifications which may be incorrectly categorized will be given
                                 back as Identifiers in order to allow the syntactic classifier to
                                 subsume the classification.

#### Returns

[`ClassificationResult`](ClassificationResult.md)

#### Deprecated

Use getLexicalClassifications instead.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11017

***

### getEncodedLexicalClassifications()

```ts
getEncodedLexicalClassifications(
   text, 
   endOfLineState, 
   syntacticClassifierAbsent): Classifications
```

#### Parameters

• **text**: `string`

• **endOfLineState**: [`EndOfLineState`](../enumerations/EndOfLineState.md)

• **syntacticClassifierAbsent**: `boolean`

#### Returns

[`Classifications`](Classifications.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11018
