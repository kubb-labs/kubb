import type { Reseller } from '../Reseller.ts'
import type { UpdateResellerDto } from '../UpdateResellerDto.ts'

export type ResellersControllerUpdateResellerPathParams = {
  /**
   * @type number
   */
  id: number
}

export type ResellersControllerUpdateReseller200 = Reseller

export type ResellersControllerUpdateResellerMutationRequest = UpdateResellerDto

export type ResellersControllerUpdateResellerMutationResponse = ResellersControllerUpdateReseller200

export type ResellersControllerUpdateResellerMutation = {
  Response: ResellersControllerUpdateReseller200
  Request: ResellersControllerUpdateResellerMutationRequest
  PathParams: ResellersControllerUpdateResellerPathParams
  Errors: any
}
