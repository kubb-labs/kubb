import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { BankType } from '../models/ts/BankType.ts'

export const bankTypeSchema = z.enum(['CHECKING', 'SAVING']) as unknown as ToZod<BankType>

export type BankTypeSchema = BankType
