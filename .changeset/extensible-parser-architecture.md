---
'@kubb/plugin-oas': minor
'@kubb/plugin-zod': patch
---

Add extensible parser architecture with shared utilities and `createParser` helper to support future validation libraries like Valibot, ArkType, and Zod Mini.

**New Features:**
- Added `createParser()` factory function for easy parser creation
- Added base parser types and utilities in `@kubb/plugin-oas/parsers`
- Extracted common mini mode helpers for reuse across parsers
- Added comprehensive parser documentation in `parsers/README.md`
- Updated AGENTS.md with parser architecture guidelines

**Benefits:**
- Eliminates duplication of mini mode logic across parsers
- Makes it easy to add support for new validation libraries (Valibot, ArkType, etc.)
- Provides consistent handling of modifiers (optional, nullable, default)
- Automatic handling of union, array, tuple, and object types
- Backwards compatible - plugin-zod re-exports utilities

**Breaking Changes:**
None - all changes are backwards compatible
