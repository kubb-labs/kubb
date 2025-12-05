import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { PageBankConnection } from '../models/ts/PageBankConnection.ts'
import { bankConnectionSchema } from './bankConnectionSchema.ts'

export const pageBankConnectionSchema = z.object({
  next_cursor: z.string().nullish(),
  items: z.array(z.lazy(() => bankConnectionSchema)),
}) as unknown as ToZod<PageBankConnection>

export type PageBankConnectionSchema = PageBankConnection
