import type { PageVendorResponse } from '../models/ts/PageVendorResponse.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { vendorResponseSchema } from './vendorResponseSchema.ts'
import { z } from 'zod'

export const pageVendorResponseSchema = z.object({
  next_cursor: z.string().nullish(),
  items: z.array(z.lazy(() => vendorResponseSchema)),
}) as unknown as ToZod<PageVendorResponse>

export type PageVendorResponseSchema = PageVendorResponse
