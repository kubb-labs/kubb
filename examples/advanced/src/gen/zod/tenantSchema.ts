import type { Tenant } from '../models/ts/Tenant.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const tenantSchema = z.object({
  id: z.number(),
  shortName: z.string(),
  name: z.string(),
  emailsAllowed: z.array(z.string()),
  emailsDenied: z.array(z.string()),
  domainsAllowed: z.array(z.string()),
}) as unknown as ToZod<Tenant>

export type TenantSchema = Tenant
