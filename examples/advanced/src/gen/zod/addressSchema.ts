import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { Address } from '../models/ts/Address.ts'

/**
 * @description Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).
 */
export const addressSchema = z
  .object({
    line1: z.string().describe('Address line 1, no PO Box.').nullish(),
    line2: z.string().describe('Address line 2 (e.g., apartment, suite, unit, or building).').nullish(),
    city: z.string().describe('City, district, suburb, town, or village.').nullish(),
    state: z.string().describe('For US-addressed the 2-letter State abbreviation. For international-addresses the county, providence, or region.').nullish(),
    country: z.string().describe('Two-letter country code (ISO 3166-1 alpha-2).').nullish(),
    postal_code: z.string().describe('ZIP or postal code.').nullish(),
    phone_number: z.string().describe('Phone number.').nullish(),
  })
  .describe('Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).') as unknown as ToZod<Address>

export type AddressSchema = Address
