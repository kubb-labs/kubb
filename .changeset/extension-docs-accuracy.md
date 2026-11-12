---
'@kubb/adapter-oas': patch
'@kubb/parser-md': patch
'@kubb/parser-ts': patch
'@kubb/plugin-barrel': patch
---

Correct the docs these packages ship for kubb.dev. The adapter's discriminator and enum examples show the real generated output, `unknownType` and `emptySchemaType` describe the schemas they cover, and `parserMd().print` is documented as joining strings.
