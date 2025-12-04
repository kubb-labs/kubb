import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { BeneficiaryBank } from '../models/ts/BeneficiaryBank.ts'
import { addressSchema } from './addressSchema.ts'

export const beneficiaryBankSchema = z.object({
  name: z.string().nullish(),
  address: z.lazy(() => addressSchema).nullish(),
}) as unknown as ToZod<BeneficiaryBank>

export type BeneficiaryBankSchema = BeneficiaryBank
