import type { CreateTenantDto } from '../models/ts/CreateTenantDto.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const createTenantDtoSchema = z.object({
  shortName: z.string(),
  name: z.string(),
  resellerId: z.number(),
  emailsAllowed: z.array(z.string()),
  emailsDenied: z.array(z.string()),
  domainsAllowed: z.array(z.string()),
}) as unknown as ToZod<CreateTenantDto>

export type CreateTenantDtoSchema = CreateTenantDto
