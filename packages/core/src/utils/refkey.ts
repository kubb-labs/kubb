/**
 * Reference Key (refkey) system for automatic import management
 * Inspired by Alloy framework's refkey concept
 */

let refkeyCounter = 0

/**
 * Unique identifier for a symbol in generated code
 */
export type RefKey<T = unknown> = {
  readonly id: string
  readonly _type?: T
}

/**
 * Information about a symbol that can be referenced
 */
export type SymbolInfo = {
  /**
   * The name of the symbol as declared
   */
  name: string
  /**
   * The file path where the symbol is declared
   */
  path: string
  /**
   * Whether this is a type-only export
   */
  isTypeOnly?: boolean
  /**
   * Whether this is a namespace export
   */
  isNameSpace?: boolean
  /**
   * The refkey associated with this symbol
   */
  refkey: RefKey
}

/**
 * Storage for symbol information indexed by refkey
 */
const symbolRegistry = new Map<string, SymbolInfo>()

/**
 * Creates a unique reference key for a symbol
 * Similar to Alloy's refkey() function
 *
 * @example
 * ```tsx
 * const fooRef = createRef()
 *
 * // In one file
 * <File.Source name="foo" refkey={fooRef}>
 *   export const foo = "Hello"
 * </File.Source>
 *
 * // In another file - import will be auto-generated
 * <Function>
 *   console.log({fooRef})
 * </Function>
 * ```
 */
export function createRef<T = unknown>(): RefKey<T> {
  const id = `__kubb_ref_${refkeyCounter++}`
  return { id }
}

/**
 * Registers a symbol with its reference key
 */
export function registerSymbol(info: SymbolInfo): void {
  symbolRegistry.set(info.refkey.id, info)
}

/**
 * Retrieves symbol information by refkey
 */
export function getSymbolInfo(refkey: RefKey): SymbolInfo | undefined {
  return symbolRegistry.get(refkey.id)
}

/**
 * Checks if a refkey has been registered
 */
export function hasSymbol(refkey: RefKey): boolean {
  return symbolRegistry.has(refkey.id)
}

/**
 * Clears all registered symbols (useful for testing)
 */
export function clearSymbolRegistry(): void {
  symbolRegistry.clear()
  refkeyCounter = 0
}

/**
 * Gets all registered symbols
 */
export function getAllSymbols(): Map<string, SymbolInfo> {
  return new Map(symbolRegistry)
}

/**
 * Resolves imports needed for a file based on refkeys used
 * Deduplicates imports from the same file path
 */
export function resolveImportsForFile(
  currentFilePath: string,
  refkeysUsed: Set<RefKey>,
): Array<{
  name: string | Array<string>
  path: string
  isTypeOnly?: boolean
  isNameSpace?: boolean
}> {
  // Group imports by file path to deduplicate
  const importsByPath = new Map<
    string,
    {
      names: Set<string>
      isTypeOnly: boolean
      isNameSpace: boolean
    }
  >()

  for (const refkey of refkeysUsed) {
    const symbolInfo = getSymbolInfo(refkey)
    if (!symbolInfo) {
      continue
    }

    // Don't import from the same file
    if (symbolInfo.path === currentFilePath) {
      continue
    }

    // Group symbols from the same path
    const existing = importsByPath.get(symbolInfo.path)
    if (existing) {
      existing.names.add(symbolInfo.name)
      // If any import is not type-only, the whole import is not type-only
      if (!symbolInfo.isTypeOnly) {
        existing.isTypeOnly = false
      }
    } else {
      importsByPath.set(symbolInfo.path, {
        names: new Set([symbolInfo.name]),
        isTypeOnly: symbolInfo.isTypeOnly ?? false,
        isNameSpace: symbolInfo.isNameSpace ?? false,
      })
    }
  }

  // Convert to array format
  const imports: Array<{
    name: string | Array<string>
    path: string
    isTypeOnly?: boolean
    isNameSpace?: boolean
  }> = []

  for (const [path, { names, isTypeOnly, isNameSpace }] of importsByPath) {
    const nameArray = Array.from(names)
    const importEntry: {
      name: string | Array<string>
      path: string
      isTypeOnly?: boolean
      isNameSpace?: boolean
    } = {
      name: nameArray.length === 1 ? (nameArray[0] as string) : nameArray,
      path,
    }

    // Only include flags if they are true
    if (isTypeOnly) {
      importEntry.isTypeOnly = true
    }
    if (isNameSpace) {
      importEntry.isNameSpace = true
    }

    imports.push(importEntry)
  }

  return imports
}
