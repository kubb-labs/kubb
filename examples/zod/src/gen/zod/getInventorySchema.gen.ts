import { z } from '../../zod.ts'

/**
 * @description successful operation
 */
export const getInventory200Schema = z.object({}).catchall(z.number())
export type GetInventory200Schema = z.infer<typeof getInventory200Schema>
/**
 * @description successful operation
 */
export const getInventoryQueryResponseSchema = z.object({}).catchall(z.number())
export type GetInventoryQueryResponseSchema = z.infer<typeof getInventoryQueryResponseSchema>
