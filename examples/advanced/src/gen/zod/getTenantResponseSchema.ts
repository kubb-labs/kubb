import type { GetTenantResponse } from '../models/ts/GetTenantResponse.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { licenseSchema } from './licenseSchema.ts'
import { resellerSchema } from './resellerSchema.ts'
import { weldPackSchema } from './weldPackSchema.ts'
import { z } from 'zod/v4'

export const getTenantResponseSchema = z.object({
  id: z.number(),
  shortName: z.string(),
  name: z.string(),
  emailsAllowed: z.array(z.string()),
  emailsDenied: z.array(z.string()),
  domainsAllowed: z.array(z.string()),
  get licenses() {
    return z.array(licenseSchema)
  },
  get weldPacks() {
    return z.array(weldPackSchema)
  },
  get reseller() {
    return resellerSchema
  },
}) as unknown as ToZod<GetTenantResponse>

export type GetTenantResponseSchema = GetTenantResponse
