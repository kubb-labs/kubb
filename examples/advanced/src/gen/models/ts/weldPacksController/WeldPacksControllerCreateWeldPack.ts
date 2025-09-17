import type { CreateWeldPackDto } from '../CreateWeldPackDto.ts'
import type { WeldPack } from '../WeldPack.ts'

export type WeldPacksControllerCreateWeldPack201 = WeldPack

export type WeldPacksControllerCreateWeldPackMutationRequest = CreateWeldPackDto

export type WeldPacksControllerCreateWeldPackMutationResponse = WeldPacksControllerCreateWeldPack201

export type WeldPacksControllerCreateWeldPackMutation = {
  Response: WeldPacksControllerCreateWeldPack201
  Request: WeldPacksControllerCreateWeldPackMutationRequest
  Errors: any
}
