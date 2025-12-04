import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { OriginatingAccountResponseType } from '../models/ts/OriginatingAccountResponseType.ts'

export const originatingAccountResponseTypeSchema = z.enum(['BREX_CASH']) as unknown as ToZod<OriginatingAccountResponseType>

export type OriginatingAccountResponseTypeSchema = OriginatingAccountResponseType
