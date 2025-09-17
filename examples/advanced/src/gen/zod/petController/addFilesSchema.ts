import type { AddFiles200, AddFiles405, AddFilesMutationRequest, AddFilesMutationResponse } from '../../models/ts/petController/AddFiles.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { petSchema } from '../petSchema.ts'
import { z } from 'zod/v4'

/**
 * @description successful operation
 */
export const addFiles200Schema = petSchema.omit({ name: true }) as unknown as ToZod<AddFiles200>

export type AddFiles200Schema = AddFiles200

/**
 * @description Invalid input
 */
export const addFiles405Schema = z.any() as unknown as ToZod<AddFiles405>

export type AddFiles405Schema = AddFiles405

export const addFilesMutationRequestSchema = petSchema.omit({ id: true }) as unknown as ToZod<AddFilesMutationRequest>

export type AddFilesMutationRequestSchema = AddFilesMutationRequest

export const addFilesMutationResponseSchema = addFiles200Schema as unknown as ToZod<AddFilesMutationResponse>

export type AddFilesMutationResponseSchema = AddFilesMutationResponse
