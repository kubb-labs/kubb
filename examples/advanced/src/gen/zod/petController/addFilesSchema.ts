import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type { AddFiles200, AddFiles405, AddFilesMutationRequest, AddFilesMutationResponse } from '../../models/ts/petController/AddFiles.ts'
import { petSchema } from '../petSchema.ts'

/**
 * @description successful operation
 */
export const addFiles200Schema = z.lazy(() => petSchema).schema.omit({ name: true }) as unknown as ToZod<AddFiles200>

export type AddFiles200Schema = AddFiles200

/**
 * @description Invalid input
 */
export const addFiles405Schema = z.any() as unknown as ToZod<AddFiles405>

export type AddFiles405Schema = AddFiles405

export const addFilesMutationRequestSchema = z.lazy(() => petSchema).schema.omit({ id: true }) as unknown as ToZod<AddFilesMutationRequest>

export type AddFilesMutationRequestSchema = AddFilesMutationRequest

export const addFilesMutationResponseSchema = z.lazy(() => addFiles200Schema) as unknown as ToZod<AddFilesMutationResponse>

export type AddFilesMutationResponseSchema = AddFilesMutationResponse
