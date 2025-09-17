import type { ActivateWeldPackDto } from '../models/ts/ActivateWeldPackDto.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const activateWeldPackDtoSchema = z.object({
  tenantId: z.number(),
}) as unknown as ToZod<ActivateWeldPackDto>

export type ActivateWeldPackDtoSchema = ActivateWeldPackDto
