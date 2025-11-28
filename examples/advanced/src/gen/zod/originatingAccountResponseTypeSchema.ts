import type { OriginatingAccountResponseType } from '../models/ts/OriginatingAccountResponseType.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

export const originatingAccountResponseTypeSchema = z.enum(['BREX_CASH']) as unknown as ToZod<OriginatingAccountResponseType>

export type OriginatingAccountResponseTypeSchema = OriginatingAccountResponseType
