export type FindArtifactsQueryPage = number

export type FindArtifactsQueryLimit = number

export type FindArtifactsQuerySort = string

/**
 * @description Results
 */
export type FindArtifactsStatus200 = object

export type FindArtifactsRequestConfig = {
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

export type FindArtifactsResponses = {
  '200': findArtifactsStatus200
}

/**
 * @description Union of all possible responses
 */
export type FindArtifactsResponse = findArtifactsStatus200
