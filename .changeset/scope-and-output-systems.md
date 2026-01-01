---
"@kubb/core": minor
---

Add Scope Context and Output Organization systems inspired by Alloy framework

Introduces two new systems to improve code generation organization and management:

**Scope Context System:**
- Hierarchical scope management for symbol visibility
- Parent-child scope relationships with lookup chain
- Symbol shadowing support
- Scoped context helper for convenient API
- Integration with RefKey system

**New Scope APIs:**
- `createScope(metadata?)` - Create a new scope
- `pushScope(scope)` / `popScope()` - Manage scope stack
- `withScope(scope, fn)` - Execute code in scope context
- `defineSymbolInScope(name, refkey)` - Add symbol to current scope
- `lookupSymbol(name)` - Lookup symbol in scope chain
- `hasSymbolInCurrentScope(name)` - Check symbol in current scope only
- `getSymbolsInScope()` - Get all symbols in current scope
- `createScopedContext(metadata?)` - Create helper with convenient methods

**Output Organization System:**
- Declarative directory structure definition
- Automatic directory creation
- Fluent builder API for organizing files
- File metadata support
- Path grouping and organization utilities

**New Output APIs:**
- `createOutputBuilder(rootPath)` - Create output builder
- `createOutputOrganizer(rootPath)` - Create output organizer
- `defineOutputStructure(rootPath, definition)` - Declaratively define structure
- `OutputBuilder` class with `.directory()`, `.file()`, `.up()` methods
- `OutputOrganizer` class for managing file structure

These systems complement the existing RefKey system to provide comprehensive Alloy-inspired code generation utilities.

See documentation:
- `docs/knowledge-base/scope-system.md` - Scope Context system guide
