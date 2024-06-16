import { z } from 'zod'

/**
 * @description successful operation
 */
export const getInventory200Schema = z.object({}).catchall(z.coerce.number())
/**
 * @description successful operation
 */
export const getInventoryQueryResponseSchema = z.object({}).catchall(z.coerce.number())
