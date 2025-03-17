import type { PetNotFoundType } from '../ts/PetNotFoundType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'

export const petNotFoundSchema = z.object({
  code: z.number().int().optional(),
  message: z.string().optional(),
}) as unknown as ToZod<PetNotFoundType>

export type PetNotFoundSchema = PetNotFoundType
