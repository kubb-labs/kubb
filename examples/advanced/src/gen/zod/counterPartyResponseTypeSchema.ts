import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { CounterPartyResponseType } from '../models/ts/CounterPartyResponseType.ts'

export const counterPartyResponseTypeSchema = z.enum(['VENDOR', 'BOOK_TRANSFER', 'BANK_ACCOUNT']) as unknown as ToZod<CounterPartyResponseType>

export type CounterPartyResponseTypeSchema = CounterPartyResponseType
