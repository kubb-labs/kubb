import * as z from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { PageSize } from '../models/ts/PageSize.ts'

export const pageSizeSchema = z.number() as unknown as ToZod<PageSize>

export type PageSizeSchema = PageSize
