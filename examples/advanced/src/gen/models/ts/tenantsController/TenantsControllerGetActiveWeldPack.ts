import type { WeldPack } from '../WeldPack.ts'

export type TenantsControllerGetActiveWeldPackPathParams = {
  /**
   * @type number
   */
  id: number
}

export type TenantsControllerGetActiveWeldPack200 = WeldPack

export type TenantsControllerGetActiveWeldPackQueryResponse = TenantsControllerGetActiveWeldPack200

export type TenantsControllerGetActiveWeldPackQuery = {
  Response: TenantsControllerGetActiveWeldPack200
  PathParams: TenantsControllerGetActiveWeldPackPathParams
  Errors: any
}
