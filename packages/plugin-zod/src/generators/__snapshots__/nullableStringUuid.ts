import { z } from 'zod'

export const nullableStringUuid = z.string().uuid().nullable()
