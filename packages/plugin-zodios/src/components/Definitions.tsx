import type { ReactNode } from 'react'

type Props = {
  /**
   * Name of the function
   */
  name: string
  definitions: string[]
  baseURL: string | undefined
}

export function Definitions({ name, definitions, baseURL }: Props): ReactNode {
  return (
    <>
      {`export const endpoints = makeApi([${definitions.join(',')}])`}
      <br />
      {'export const getAPI = (baseUrl: string) => new Zodios(baseUrl, endpoints)'}
      <br />
      {baseURL && `export const ${name} = new Zodios('${baseURL}', endpoints)`}
      {!baseURL && `export const  ${name} = new Zodios(endpoints)`}
      <br />
      {`export default ${name}`}
    </>
  )
}
