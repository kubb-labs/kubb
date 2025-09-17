import type { WeldPack } from '../WeldPack.ts'

export type WeldPacksControllerDeactivateLicensePathParams = {
  /**
   * @type number
   */
  id: number
}

export type WeldPacksControllerDeactivateLicense200 = WeldPack

export type WeldPacksControllerDeactivateLicenseMutationResponse = WeldPacksControllerDeactivateLicense200

export type WeldPacksControllerDeactivateLicenseMutation = {
  Response: WeldPacksControllerDeactivateLicense200
  PathParams: WeldPacksControllerDeactivateLicensePathParams
  Errors: any
}
