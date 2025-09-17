import type { UpdateResellerDto } from '../models/ts/UpdateResellerDto.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const updateResellerDtoSchema = z.object({
  name: z.string(),
}) as unknown as ToZod<UpdateResellerDto>

export type UpdateResellerDtoSchema = UpdateResellerDto
