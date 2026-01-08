import type { AddFilesStatus200, AddFilesStatus405, AddFilesRequestData, AddFilesResponseData } from '../../models/ts/petController/AddFiles.ts'
import type { ToZod } from '../../.kubb/ToZod.ts'
import { petSchema } from '../petSchema.ts'
import { z } from 'zod'

/**
 * @description successful operation
 */
export const addFilesStatus200Schema = z.lazy(() => petSchema).schema.omit({ name: true }) as unknown as ToZod<AddFilesStatus200>

export type AddFilesStatus200Schema = AddFilesStatus200

/**
 * @description Invalid input
 */
export const addFilesStatus405Schema = z.any() as unknown as ToZod<AddFilesStatus405>

export type AddFilesStatus405Schema = AddFilesStatus405

export const addFilesRequestDataSchema = z.lazy(() => petSchema).schema.omit({ id: true }) as unknown as ToZod<AddFilesRequestData>

export type AddFilesRequestDataSchema = AddFilesRequestData

export const addFilesResponseDataSchema = z.lazy(() => addFilesStatus200Schema) as unknown as ToZod<AddFilesResponseData>

export type AddFilesResponseDataSchema = AddFilesResponseData
