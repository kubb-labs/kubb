import { z } from 'zod'

export const nullableStringWithAnyOf = z.union([z.string(), z.null()])
