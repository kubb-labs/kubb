import type { BeneficiaryBank } from '../models/ts/BeneficiaryBank.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { addressSchema } from './addressSchema.ts'
import { z } from 'zod'

export const beneficiaryBankSchema = z.object({
  name: z.string().nullish(),
  address: z.lazy(() => addressSchema).nullish(),
}) as unknown as ToZod<BeneficiaryBank>

export type BeneficiaryBankSchema = BeneficiaryBank
