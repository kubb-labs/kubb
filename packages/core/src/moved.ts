import { Diagnostics } from './Diagnostics.ts'

// Published @kubb/kit 5.23.1 still imports these from core; the stubs turn a missing export into a clear error.
function movedToKit(name: string): never {
  throw new Diagnostics.Error({
    code: Diagnostics.code.movedToKit,
    severity: 'error',
    message: `\`${name}\` moved from @kubb/core to @kubb/kit.`,
    help: 'Import it from `kubb/kit`, and keep every @kubb package on one version.',
  })
}

const stub =
  (name: string) =>
  (..._args: Array<unknown>): never =>
    movedToKit(name)

/** @deprecated Moved to `kubb/kit`. Removed in Kubb v6. */
export const addGenerator = stub('addGenerator')

/** @deprecated Moved to `kubb/kit`. Removed in Kubb v6. */
export const setResolver = stub('setResolver')

/** @deprecated Moved to `kubb/kit`. Removed in Kubb v6. */
export const setMacros = stub('setMacros')

/** @deprecated Moved to `kubb/kit`. Removed in Kubb v6. */
export const addMacro = stub('addMacro')

/** @deprecated Moved to `kubb/kit`. Removed in Kubb v6. */
export const createResolver = stub('createResolver')

/** @deprecated Moved to `kubb/kit`. Removed in Kubb v6. */
export const defineResolver = stub('defineResolver')

/** @deprecated Moved to `kubb/kit`. Removed in Kubb v6. */
export const defineGenerator = stub('defineGenerator')

/** @deprecated Moved to `kubb/kit`. Removed in Kubb v6. */
export const toFilePath = stub('toFilePath')

/** @deprecated Moved to `kubb/kit`. Removed in Kubb v6. */
export class Resolver {
  constructor(..._args: Array<unknown>) {
    movedToKit('Resolver')
  }

  static merge(..._args: Array<unknown>): never {
    return movedToKit('Resolver.merge')
  }
}
