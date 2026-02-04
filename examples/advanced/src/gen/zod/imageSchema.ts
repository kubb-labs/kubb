import z from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { Image } from '../models/ts/Image.ts'

export const imageSchema = z.string().nullable() as unknown as ToZod<Image>

export type ImageSchema = Image
