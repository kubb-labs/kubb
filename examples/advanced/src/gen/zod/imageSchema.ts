import * as z from 'zod'

export const imageSchema = z.string().nullable()

export type ImageSchema = z.infer<typeof imageSchema>
