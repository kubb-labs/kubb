import type { Image } from '../models/ts/Image.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

export const imageSchema = z.string().nullable() as unknown as ToZod<Image>

export type ImageSchema = Image
