import type {
  ResellersControllerGetResellers200,
  ResellersControllerGetResellersQueryResponse,
} from '../../models/ts/resellersController/ResellersControllerGetResellers.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { resellerSchema } from '../resellerSchema.ts'
import { z } from 'zod/v4'

export const resellersControllerGetResellers200Schema = z.array(resellerSchema) as unknown as ToZod<ResellersControllerGetResellers200>

export type ResellersControllerGetResellers200Schema = ResellersControllerGetResellers200

export const resellersControllerGetResellersQueryResponseSchema =
  resellersControllerGetResellers200Schema as unknown as ToZod<ResellersControllerGetResellersQueryResponse>

export type ResellersControllerGetResellersQueryResponseSchema = ResellersControllerGetResellersQueryResponse
