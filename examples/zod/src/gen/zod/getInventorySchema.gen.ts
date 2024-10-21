import { z } from '../../zod.ts'

/**
 * @description successful operation
 */
export const getInventory200Schema = z.object({}).catchall(z.number().int())

export type GetInventory200Schema = z.infer<typeof getInventory200Schema>

export const getInventoryQueryResponseSchema = z.lazy(() => getInventory200Schema)

export type GetInventoryQueryResponseSchema = z.infer<typeof getInventoryQueryResponseSchema>
