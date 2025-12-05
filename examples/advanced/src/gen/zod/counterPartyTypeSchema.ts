import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { CounterPartyType } from '../models/ts/CounterPartyType.ts'

export const counterPartyTypeSchema = z.enum(['VENDOR', 'BOOK_TRANSFER']) as unknown as ToZod<CounterPartyType>

export type CounterPartyTypeSchema = CounterPartyType
