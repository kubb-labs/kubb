import { Diagnostics } from './Diagnostics.ts'

// Published @kubb/kit 5.23.1 still imports these from core; the stubs turn a missing export into a clear error.
function movedToKit(name: string): never {
  throw new Diagnostics.Error({
    code: Diagnostics.code.movedToKit,
    severity: 'error',
    message: `\`${name}\` moved from @kubb/core to @kubb/kit.`,
    help: `Import it from \`kubb/kit\`, and keep every @kubb package on one version. See ${Diagnostics.docsUrl('KUBB_MOVED_TO_KIT')}`,
  })
}

/**
 * @deprecated Moved to `kubb/kit`. Removed in v6.
 */
export function addGenerator(..._args: Array<unknown>): never {
  return movedToKit('addGenerator')
}

/**
 * @deprecated Moved to `kubb/kit`. Removed in v6.
 */
export function setResolver(..._args: Array<unknown>): never {
  return movedToKit('setResolver')
}

/**
 * @deprecated Moved to `kubb/kit`. Removed in v6.
 */
export function setMacros(..._args: Array<unknown>): never {
  return movedToKit('setMacros')
}

/**
 * @deprecated Moved to `kubb/kit`. Removed in v6.
 */
export function addMacro(..._args: Array<unknown>): never {
  return movedToKit('addMacro')
}

/**
 * @deprecated Moved to `kubb/kit`. Removed in v6.
 */
export function createResolver(..._args: Array<unknown>): never {
  return movedToKit('createResolver')
}

/**
 * @deprecated Moved to `kubb/kit`. Removed in v6.
 */
export function defineResolver(..._args: Array<unknown>): never {
  return movedToKit('defineResolver')
}

/**
 * @deprecated Moved to `kubb/kit`. Removed in v6.
 */
export function defineGenerator(..._args: Array<unknown>): never {
  return movedToKit('defineGenerator')
}

/**
 * @deprecated Moved to `kubb/kit`. Removed in v6.
 */
export function toFilePath(..._args: Array<unknown>): never {
  return movedToKit('toFilePath')
}

/**
 * @deprecated Moved to `kubb/kit`. Removed in v6.
 */
export class Resolver {
  constructor(..._args: Array<unknown>) {
    movedToKit('Resolver')
  }

  /**
   * @deprecated Moved to `kubb/kit`. Removed in v6.
   */
  static merge(..._args: Array<unknown>): never {
    return movedToKit('Resolver.merge')
  }
}
