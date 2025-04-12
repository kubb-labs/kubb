import { z } from 'zod'

/**
 * @description successful operation
 */
export const getInventory200Schema = z.object({}).catchall(z.number().int())

export const getInventoryQueryResponseSchema = z.lazy(() => getInventory200Schema)
