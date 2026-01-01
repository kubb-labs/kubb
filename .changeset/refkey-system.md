---
"@kubb/core": minor
---

Add RefKey system for automatic import management inspired by Alloy framework

Introduces a new RefKey (reference key) system that provides automatic import management for generated code. This feature allows developers to create unique identifiers for symbols and automatically generate imports when those symbols are referenced in other files.

**New APIs:**
- `createRef<T>()` - Create a unique reference key for a symbol
- `registerSymbol(info)` - Register a symbol with its metadata (name, path, refkey)
- `getSymbolInfo(refkey)` - Retrieve registered symbol information
- `hasSymbol(refkey)` - Check if a refkey has been registered
- `resolveImportsForFile(path, refkeys)` - Resolve imports needed for a file
- `clearSymbolRegistry()` - Clear all registered symbols (for testing)
- `getAllSymbols()` - Get all registered symbols

**Benefits:**
- No manual import management - imports are generated automatically
- Safer refactoring - references update automatically if symbols move between files
- Type-safe references - RefKeys can be typed to match their symbol type
- Cross-file symbol references - easily reference symbols across generated files

See the documentation in `docs/knowledge-base/refkey.md` for detailed usage examples.
