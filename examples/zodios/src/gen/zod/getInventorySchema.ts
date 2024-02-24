import { z } from 'zod'

/**
 * @description successful operation
 */
export const getInventory200Schema = z.object({}).catchall(z.number())

/**
 * @description successful operation
 */
export const getInventoryQueryResponseSchema = z.object({}).catchall(z.number())
