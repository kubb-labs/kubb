import * as z from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { Page } from '../models/ts/Page.ts'

export const pageSchema = z.string() as unknown as ToZod<Page>

export type PageSchema = Page
