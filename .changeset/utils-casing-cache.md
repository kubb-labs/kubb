---
'@kubb/adapter-oas': patch
'@kubb/core': patch
'@kubb/kit': patch
---

Cache the results of `camelCase` and `pascalCase`. A build resolves the same names many times, about 47,000 calls for a spec with 1,000 schemas, and each call ran four regular expressions. The cache holds up to 10,000 entries and then starts over.
