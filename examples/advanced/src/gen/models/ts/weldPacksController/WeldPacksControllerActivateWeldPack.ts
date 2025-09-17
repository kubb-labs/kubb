import type { ActivateWeldPackDto } from '../ActivateWeldPackDto.ts'
import type { WeldPack } from '../WeldPack.ts'

export type WeldPacksControllerActivateWeldPackPathParams = {
  /**
   * @type number
   */
  id: number
}

export type WeldPacksControllerActivateWeldPack200 = WeldPack

export type WeldPacksControllerActivateWeldPackMutationRequest = ActivateWeldPackDto

export type WeldPacksControllerActivateWeldPackMutationResponse = WeldPacksControllerActivateWeldPack200

export type WeldPacksControllerActivateWeldPackMutation = {
  Response: WeldPacksControllerActivateWeldPack200
  Request: WeldPacksControllerActivateWeldPackMutationRequest
  PathParams: WeldPacksControllerActivateWeldPackPathParams
  Errors: any
}
