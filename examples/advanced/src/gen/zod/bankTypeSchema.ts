import type { BankType } from '../models/ts/BankType.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

export const bankTypeSchema = z.enum(['CHECKING', 'SAVING']) as unknown as ToZod<BankType>

export type BankTypeSchema = BankType
