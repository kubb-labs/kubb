import type { UpdateWeldPackDto } from '../UpdateWeldPackDto.ts'
import type { WeldPack } from '../WeldPack.ts'

export type WeldPacksControllerUpdateWeldPackPathParams = {
  /**
   * @type number
   */
  id: number
}

export type WeldPacksControllerUpdateWeldPack200 = WeldPack

export type WeldPacksControllerUpdateWeldPackMutationRequest = UpdateWeldPackDto

export type WeldPacksControllerUpdateWeldPackMutationResponse = WeldPacksControllerUpdateWeldPack200

export type WeldPacksControllerUpdateWeldPackMutation = {
  Response: WeldPacksControllerUpdateWeldPack200
  Request: WeldPacksControllerUpdateWeldPackMutationRequest
  PathParams: WeldPacksControllerUpdateWeldPackPathParams
  Errors: any
}
