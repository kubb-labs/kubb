import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { ReceivingAccountType } from '../models/ts/ReceivingAccountType.ts'

export const receivingAccountTypeSchema = z.enum(['BREX_CASH']) as unknown as ToZod<ReceivingAccountType>

export type ReceivingAccountTypeSchema = ReceivingAccountType
