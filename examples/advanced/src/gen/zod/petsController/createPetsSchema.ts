import { z } from 'zod'

export const createPetsHeaderParamsSchema = z.object({ 'X-EXAMPLE': z.enum([`ONE`, `TWO`, `THREE`]).describe(`Header parameters`) })
export const createPetsMutationRequestSchema = z.object({ 'name': z.string(), 'tag': z.string() })
export const createPetsMutationResponseSchema = z.any()
export const createPetsPathParamsSchema = z.object({ 'uuid': z.string().describe(`UUID`) })
export const createPetsQueryParamsSchema = z.object({ 'offset': z.number().describe(`Offset`).optional() }).optional()
