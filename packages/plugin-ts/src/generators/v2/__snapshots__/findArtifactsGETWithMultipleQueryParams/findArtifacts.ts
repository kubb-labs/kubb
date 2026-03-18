export type findArtifactsQueryPage = number

export type findArtifactsQueryLimit = number

export type findArtifactsQuerySort = string

/**
 * @description Results
 */
export type findArtifactsStatus200 = object

export type findArtifactsRequestConfig = {
  data?: never
  pathParams?: never
  queryParams?: {
    page?: findArtifactsQueryPage
    limit?: findArtifactsQueryLimit
    sort?: findArtifactsQuerySort
  }
  headerParams?: never
  url: '/artifacts'
}

export type findArtifactsResponses = {
  '200': findArtifactsStatus200
}

/**
 * @description Union of all possible responses
 */
export type findArtifactsResponse = findArtifactsStatus200
