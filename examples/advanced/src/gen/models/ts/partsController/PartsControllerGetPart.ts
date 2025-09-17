import type { Part } from '../Part.ts'

export type PartsControllerGetPartPathParams = {
  /**
   * @type string
   */
  urn: string
}

export type PartsControllerGetPart200 = Part

export type PartsControllerGetPartQueryResponse = PartsControllerGetPart200

export type PartsControllerGetPartQuery = {
  Response: PartsControllerGetPart200
  PathParams: PartsControllerGetPartPathParams
  Errors: any
}
