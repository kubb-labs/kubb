import type { CreateResellerDto } from '../models/ts/CreateResellerDto.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const createResellerDtoSchema = z.object({
  name: z.string(),
}) as unknown as ToZod<CreateResellerDto>

export type CreateResellerDtoSchema = CreateResellerDto
