import type { GetWeldCreditsResponse } from '../GetWeldCreditsResponse.ts'

export type TenantsControllerGetWeldCreditsPathParams = {
  /**
   * @type number
   */
  id: number
}

export type TenantsControllerGetWeldCredits200 = GetWeldCreditsResponse

export type TenantsControllerGetWeldCreditsQueryResponse = TenantsControllerGetWeldCredits200

export type TenantsControllerGetWeldCreditsQuery = {
  Response: TenantsControllerGetWeldCredits200
  PathParams: TenantsControllerGetWeldCreditsPathParams
  Errors: any
}
