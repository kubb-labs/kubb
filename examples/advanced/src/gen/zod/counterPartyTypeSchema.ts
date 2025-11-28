import type { CounterPartyType } from '../models/ts/CounterPartyType.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

export const counterPartyTypeSchema = z.enum(['VENDOR', 'BOOK_TRANSFER']) as unknown as ToZod<CounterPartyType>

export type CounterPartyTypeSchema = CounterPartyType
