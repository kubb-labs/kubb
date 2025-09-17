import type { Part } from '../Part.ts'
import type { SimulatePartDto } from '../SimulatePartDto.ts'

export type PartsControllerSimulatePartPathParams = {
  /**
   * @type string
   */
  urn: string
}

export type PartsControllerSimulatePart200 = Part

export type PartsControllerSimulatePartMutationRequest = SimulatePartDto

export type PartsControllerSimulatePartMutationResponse = PartsControllerSimulatePart200

export type PartsControllerSimulatePartMutation = {
  Response: PartsControllerSimulatePart200
  Request: PartsControllerSimulatePartMutationRequest
  PathParams: PartsControllerSimulatePartPathParams
  Errors: any
}
