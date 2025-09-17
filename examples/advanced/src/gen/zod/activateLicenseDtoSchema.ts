import type { ActivateLicenseDto } from '../models/ts/ActivateLicenseDto.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const activateLicenseDtoSchema = z.object({
  tenantId: z.number(),
}) as unknown as ToZod<ActivateLicenseDto>

export type ActivateLicenseDtoSchema = ActivateLicenseDto
