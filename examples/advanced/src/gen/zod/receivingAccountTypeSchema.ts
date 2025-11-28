import type { ReceivingAccountType } from '../models/ts/ReceivingAccountType.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

export const receivingAccountTypeSchema = z.enum(['BREX_CASH']) as unknown as ToZod<ReceivingAccountType>

export type ReceivingAccountTypeSchema = ReceivingAccountType
