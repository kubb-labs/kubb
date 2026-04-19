/**
 * Node.js ESM module-hooks loader for Kubb virtual modules.
 *
 * Register via:  node --import @kubb/core/register
 *
 * Intercepts bare specifiers starting with 'kubb:' and returns
 * synthetic modules backed by the AsyncLocalStorage context set
 * by runPluginAstHooks() in createKubb.ts.
 */

const COMPOSABLES_URL = new URL('./composables.js', import.meta.url).href

type ResolveContext = { parentURL: string | undefined }
type ResolveResult = { url: string; format: string; shortCircuit: boolean }
type LoadContext = { format: string }
type LoadResult = { format: string; shortCircuit: boolean; source: string }

export async function resolve(
  specifier: string,
  context: ResolveContext,
  nextResolve: (s: string, c: ResolveContext) => Promise<ResolveResult>,
): Promise<ResolveResult> {
  if (specifier.startsWith('kubb:')) {
    return {
      url: `kubb-virtual:${specifier.slice(5)}`,
      format: 'module',
      shortCircuit: true,
    }
  }
  return nextResolve(specifier, context)
}

export async function load(url: string, context: LoadContext, nextLoad: (u: string, c: LoadContext) => Promise<LoadResult>): Promise<LoadResult> {
  if (!url.startsWith('kubb-virtual:')) {
    return nextLoad(url, context)
  }

  const name = url.slice('kubb-virtual:'.length)

  switch (name) {
    case 'files':
      return {
        format: 'module',
        shortCircuit: true,
        source: `import { useFiles } from '${COMPOSABLES_URL}'; export const files = useFiles;`,
      }
    case 'driver':
      return {
        format: 'module',
        shortCircuit: true,
        source: `import { useDriver } from '${COMPOSABLES_URL}'; export const driver = useDriver;`,
      }
    default:
      throw new Error(`[kubb] Unknown virtual module 'kubb:${name}'. Available: kubb:files, kubb:driver`)
  }
}
