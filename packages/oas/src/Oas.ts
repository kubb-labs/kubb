import BaseOas from 'oas'
import OASNormalize from 'oas-normalize'
import type { OASDocument, User } from 'oas/types'
type Options = {
  validate?: boolean
}

export class Oas extends BaseOas {
  #options: Options = {}

  constructor({ oas, user }: { oas: OASDocument | string; user?: User }, options: Options = {}) {
    super(oas, user)

    this.#options = options
  }

  async valdiate() {
    const oasNormalize = new OASNormalize(this.api, {
      enablePaths: true,
      colorizeErrors: true,
    })

    await oasNormalize.validate()
  }
}
