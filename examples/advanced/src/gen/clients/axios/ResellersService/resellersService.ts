import { resellersControllerCreateReseller } from './resellersControllerCreateReseller.ts'
import { resellersControllerGetReseller } from './resellersControllerGetReseller.ts'
import { resellersControllerGetResellers } from './resellersControllerGetResellers.ts'
import { resellersControllerUpdateReseller } from './resellersControllerUpdateReseller.ts'

export function resellersService() {
  return { resellersControllerGetResellers, resellersControllerCreateReseller, resellersControllerGetReseller, resellersControllerUpdateReseller }
}
