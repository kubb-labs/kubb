import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { PageTransfer } from '../models/ts/PageTransfer.ts'
import { transferSchema } from './transferSchema.ts'

export const pageTransferSchema = z.object({
  next_cursor: z.string().nullish(),
  items: z.array(z.lazy(() => transferSchema)),
}) as unknown as ToZod<PageTransfer>

export type PageTransferSchema = PageTransfer
