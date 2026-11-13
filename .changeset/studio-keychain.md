---
"@kubb/cli": patch
---

- `kubb studio` keeps the agent key in the system keychain: macOS Keychain, Windows Credential Manager, or Secret Service on Linux.
- Without a keychain, such as in CI or a container, the key stays next to the token as before.
- A key stored by an earlier release moves to the keychain on the next token refresh.
