import type { GetInventory200Type, GetInventoryQueryResponseType } from '../ts/GetInventoryType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'

/**
 * @description successful operation
 */
export const getInventory200Schema = z.object({}).catchall(z.number().int()) as unknown as ToZod<GetInventory200Type>

export type GetInventory200Schema = GetInventory200Type

export const getInventoryQueryResponseSchema = z.lazy(() => getInventory200Schema) as unknown as ToZod<GetInventoryQueryResponseType>

export type GetInventoryQueryResponseSchema = GetInventoryQueryResponseType
