import type { CreateResellerDto } from '../CreateResellerDto.ts'
import type { Reseller } from '../Reseller.ts'

export type ResellersControllerCreateReseller201 = Reseller

export type ResellersControllerCreateResellerMutationRequest = CreateResellerDto

export type ResellersControllerCreateResellerMutationResponse = ResellersControllerCreateReseller201

export type ResellersControllerCreateResellerMutation = {
  Response: ResellersControllerCreateReseller201
  Request: ResellersControllerCreateResellerMutationRequest
  Errors: any
}
