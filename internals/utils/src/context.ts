/**
 * Context type that carries type information about its value
 * This is a branded symbol type that enables type-safe context usage
 */
export type Context<T> = symbol & { readonly __type: T }

/**
 * Context stack for tracking the current context values.
 *
 * WeakMap keyed by symbol so entries are GC-eligible once no external code
 * holds a reference to the context key — important for long-running agent
 * builds where plugins create and discard context keys across repeated runs.
 *
 * For concurrent runtime execution, consider using AsyncLocalStorage or
 * instance-based context management.
 */
const contextStack = new WeakMap<symbol, unknown[]>()
const contextDefaults = new WeakMap<symbol, unknown>()

/**
 * Provides a value to descendant components (Vue 3 style)
 *
 * @example
 * ```ts
 * const ThemeKey = Symbol('theme')
 * provide(ThemeKey, { color: 'blue' })
 * ```
 */
export function provide<T>(key: symbol | Context<T>, value: T): void {
  if (!contextStack.has(key)) {
    contextStack.set(key, [])
  }
  contextStack.get(key)!.push(value)
}

/**
 * Injects a value provided by an ancestor component (Vue 3 style)
 *
 * @example
 * ```ts
 * const theme = inject(ThemeKey, { color: 'default' })
 * ```
 */
export function inject<T>(key: symbol | Context<T>, defaultValue?: T): T {
  const stack = contextStack.get(key)
  if (!stack || stack.length === 0) {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    const storedDefault = contextDefaults.get(key)
    if (storedDefault !== undefined) {
      return storedDefault as T
    }
    throw new Error(`No value provided for key: ${key.toString()}`)
  }
  return stack[stack.length - 1] as T
}

/**
 * Removes a provided value from the context stack (for cleanup)
 * @internal
 */
export function unprovide<T>(key: symbol | Context<T>): void {
  const stack = contextStack.get(key)
  if (stack && stack.length > 0) {
    stack.pop()
  }
}

/**
 * Creates a context key with a default value (React-style compatibility)
 *
 * @example
 * ```ts
 * const ThemeContext = createContext({ color: 'blue' })
 * // ThemeContext is now typed as Context<{ color: string }>
 * const theme = useContext(ThemeContext) // theme is { color: string }
 * ```
 */
export function createContext<T>(defaultValue: T): Context<T> {
  const key = Symbol('context') as Context<T>
  contextDefaults.set(key, defaultValue)

  return key
}
