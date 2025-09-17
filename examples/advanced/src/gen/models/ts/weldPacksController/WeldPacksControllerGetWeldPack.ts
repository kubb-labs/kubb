import type { WeldPack } from '../WeldPack.ts'

export type WeldPacksControllerGetWeldPackPathParams = {
  /**
   * @type number
   */
  id: number
}

export type WeldPacksControllerGetWeldPack200 = WeldPack

export type WeldPacksControllerGetWeldPackQueryResponse = WeldPacksControllerGetWeldPack200

export type WeldPacksControllerGetWeldPackQuery = {
  Response: WeldPacksControllerGetWeldPack200
  PathParams: WeldPacksControllerGetWeldPackPathParams
  Errors: any
}
