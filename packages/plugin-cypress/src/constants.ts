import type { PluginCypress } from './types.ts'

type DataReturnType = PluginCypress['resolvedOptions']['dataReturnType']

/**
 * `dataReturnType` values where `cy.request` returns the full `Cypress.Response` object.
 */
export const DATA_RETURN_TYPE_FULL = new Set<DataReturnType>(['full'] as const)

/**
 * `dataReturnType` values where `cy.request` returns only `response.body`.
 */
export const DATA_RETURN_TYPE_DATA = new Set<DataReturnType>(['data'] as const)
