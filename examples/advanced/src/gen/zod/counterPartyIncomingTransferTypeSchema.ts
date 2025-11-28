import type { CounterPartyIncomingTransferType } from '../models/ts/CounterPartyIncomingTransferType.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

export const counterPartyIncomingTransferTypeSchema = z.enum(['BANK']) as unknown as ToZod<CounterPartyIncomingTransferType>

export type CounterPartyIncomingTransferTypeSchema = CounterPartyIncomingTransferType
