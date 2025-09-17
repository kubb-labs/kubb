import { weldPacksControllerActivateWeldPack } from './weldPacksControllerActivateWeldPack.ts'
import { weldPacksControllerCreateWeldPack } from './weldPacksControllerCreateWeldPack.ts'
import { weldPacksControllerDeactivateLicense } from './weldPacksControllerDeactivateLicense.ts'
import { weldPacksControllerDeleteWeldPack } from './weldPacksControllerDeleteWeldPack.ts'
import { weldPacksControllerGetWeldPack } from './weldPacksControllerGetWeldPack.ts'
import { weldPacksControllerGetWeldPacks } from './weldPacksControllerGetWeldPacks.ts'
import { weldPacksControllerUpdateWeldPack } from './weldPacksControllerUpdateWeldPack.ts'

export function weldPacksService() {
  return {
    weldPacksControllerGetWeldPacks,
    weldPacksControllerCreateWeldPack,
    weldPacksControllerGetWeldPack,
    weldPacksControllerUpdateWeldPack,
    weldPacksControllerDeleteWeldPack,
    weldPacksControllerActivateWeldPack,
    weldPacksControllerDeactivateLicense,
  }
}
