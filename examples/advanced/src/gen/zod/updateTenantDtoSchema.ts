import type { UpdateTenantDto } from '../models/ts/UpdateTenantDto.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const updateTenantDtoSchema = z.object({
  name: z.string(),
  resellerId: z.number(),
  emailsAllowed: z.array(z.string()),
  emailsDenied: z.array(z.string()),
  domainsAllowed: z.array(z.string()),
}) as unknown as ToZod<UpdateTenantDto>

export type UpdateTenantDtoSchema = UpdateTenantDto
