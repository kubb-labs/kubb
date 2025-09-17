import type { Reseller } from '../Reseller.ts'

export type ResellersControllerGetResellerPathParams = {
  /**
   * @type number
   */
  id: number
}

export type ResellersControllerGetReseller200 = Reseller

export type ResellersControllerGetResellerQueryResponse = ResellersControllerGetReseller200

export type ResellersControllerGetResellerQuery = {
  Response: ResellersControllerGetReseller200
  PathParams: ResellersControllerGetResellerPathParams
  Errors: any
}
