import type {
  WeldPacksControllerDeactivateLicensePathParams,
  WeldPacksControllerDeactivateLicense200,
  WeldPacksControllerDeactivateLicenseMutationResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerDeactivateLicense.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { weldPackSchema } from '../weldPackSchema.ts'
import { z } from 'zod/v4'

export const weldPacksControllerDeactivateLicensePathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<WeldPacksControllerDeactivateLicensePathParams>

export type WeldPacksControllerDeactivateLicensePathParamsSchema = WeldPacksControllerDeactivateLicensePathParams

export const weldPacksControllerDeactivateLicense200Schema = weldPackSchema as unknown as ToZod<WeldPacksControllerDeactivateLicense200>

export type WeldPacksControllerDeactivateLicense200Schema = WeldPacksControllerDeactivateLicense200

export const weldPacksControllerDeactivateLicenseMutationResponseSchema =
  weldPacksControllerDeactivateLicense200Schema as unknown as ToZod<WeldPacksControllerDeactivateLicenseMutationResponse>

export type WeldPacksControllerDeactivateLicenseMutationResponseSchema = WeldPacksControllerDeactivateLicenseMutationResponse
