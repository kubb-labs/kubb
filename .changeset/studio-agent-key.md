---
'@kubb/studio': minor
'@kubb/cli': minor
---

Add an optional agent key to `@kubb/studio`. `generateAgentKey` creates an Ed25519 key, `pairAgent` sends its public half as `public_key`, `connectAgent` signs the `challenge` Studio may send in `connect(info)`, and `refreshAgentToken` signs its request. `verifyAgentSignature`, `getTokenRefreshPayload`, and `AgentSignatureContext` let Studio check the signatures. `kubb studio` creates the key when it pairs and stores it with the token. Agents paired without a key, and a Studio that ignores the new fields, keep working as before.
