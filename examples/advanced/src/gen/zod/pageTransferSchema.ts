import type { PageTransfer } from '../models/ts/PageTransfer.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { transferSchema } from './transferSchema.ts'
import { z } from 'zod'

export const pageTransferSchema = z.object({
  next_cursor: z.string().nullish(),
  items: z.array(z.lazy(() => transferSchema)),
}) as unknown as ToZod<PageTransfer>

export type PageTransferSchema = PageTransfer
