import type { AppControllerGetStatus200, AppControllerGetStatusQueryResponse } from '../../models/ts/appController/AppControllerGetStatus.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

/**
 * @description Returns the status of the application
 */
export const appControllerGetStatus200Schema = z.any() as unknown as ToZod<AppControllerGetStatus200>

export type AppControllerGetStatus200Schema = AppControllerGetStatus200

export const appControllerGetStatusQueryResponseSchema = appControllerGetStatus200Schema as unknown as ToZod<AppControllerGetStatusQueryResponse>

export type AppControllerGetStatusQueryResponseSchema = AppControllerGetStatusQueryResponse
