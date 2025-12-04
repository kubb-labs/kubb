import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { CounterPartyIncomingTransferType } from '../models/ts/CounterPartyIncomingTransferType.ts'

export const counterPartyIncomingTransferTypeSchema = z.enum(['BANK']) as unknown as ToZod<CounterPartyIncomingTransferType>

export type CounterPartyIncomingTransferTypeSchema = CounterPartyIncomingTransferType
