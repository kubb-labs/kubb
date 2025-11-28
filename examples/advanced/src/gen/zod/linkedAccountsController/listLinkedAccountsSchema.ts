import type {
  ListLinkedAccountsQueryParams,
  ListLinkedAccounts200,
  ListLinkedAccounts400,
  ListLinkedAccounts401,
  ListLinkedAccounts403,
  ListLinkedAccountsQueryResponse,
} from '../../models/ts/linkedAccountsController/ListLinkedAccounts.ts'
import type { ToZod } from '../../.kubb/ToZod.ts'
import { pageBankConnectionSchema } from '../pageBankConnectionSchema.ts'
import { z } from 'zod'

export const listLinkedAccountsQueryParamsSchema = z
  .object({
    cursor: z.string().nullish(),
    limit: z.coerce.number().int().nullish(),
  })
  .optional() as unknown as ToZod<ListLinkedAccountsQueryParams>

export type ListLinkedAccountsQueryParamsSchema = ListLinkedAccountsQueryParams

/**
 * @description Returns a list of bank connections
 */
export const listLinkedAccounts200Schema = z.lazy(() => pageBankConnectionSchema) as unknown as ToZod<ListLinkedAccounts200>

export type ListLinkedAccounts200Schema = ListLinkedAccounts200

/**
 * @description Bad request
 */
export const listLinkedAccounts400Schema = z.any() as unknown as ToZod<ListLinkedAccounts400>

export type ListLinkedAccounts400Schema = ListLinkedAccounts400

/**
 * @description Unauthorized
 */
export const listLinkedAccounts401Schema = z.any() as unknown as ToZod<ListLinkedAccounts401>

export type ListLinkedAccounts401Schema = ListLinkedAccounts401

/**
 * @description Forbidden
 */
export const listLinkedAccounts403Schema = z.any() as unknown as ToZod<ListLinkedAccounts403>

export type ListLinkedAccounts403Schema = ListLinkedAccounts403

export const listLinkedAccountsQueryResponseSchema = z.lazy(() => listLinkedAccounts200Schema) as unknown as ToZod<ListLinkedAccountsQueryResponse>

export type ListLinkedAccountsQueryResponseSchema = ListLinkedAccountsQueryResponse
