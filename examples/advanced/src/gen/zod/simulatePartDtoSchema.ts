import type { SimulatePartDto } from '../models/ts/SimulatePartDto.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const simulatePartDtoSchema = z.object({
  simulatedWelds: z.array(z.string()),
}) as unknown as ToZod<SimulatePartDto>

export type SimulatePartDtoSchema = SimulatePartDto
