import { ast } from '@kubb/ast'
import { createResolver } from '../resolver/createResolver.ts'
import { Resolver } from '../resolver/Resolver.ts'
import { describe, expect, it } from 'vitest'
import { casing } from '../index.ts'
import { resolverCasedFile } from './resolverCasedFile.ts'
import { resolverOperationParams } from './resolverOperationParams.ts'
import { resolverOperationResponse } from './resolverOperationResponse.ts'

type PartsResolver = Resolver & typeof resolverOperationParams & typeof resolverOperationResponse

const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

function createPartsResolver(): PartsResolver {
  return createResolver<{ name: 'plugin-parts'; options: {}; resolvedOptions: {}; resolver: PartsResolver }>({
    pluginName: 'plugin-parts',
    name: (name) => casing.pascal(name),
    ...resolverOperationParams,
    ...resolverOperationResponse,
    ...resolverCasedFile(casing.pascal),
  })
}

describe('resolver parts', () => {
  it('names params and responses through the plugin casing', () => {
    const resolver = createPartsResolver()

    expect(resolver.param.query(node)).toBe('ListPetsQuery')
    expect(resolver.response.status(node, '200')).toBe('ListPetsStatus200')
    expect(resolver.response.headers(node, '200')).toBe('ListPetsStatus200Headers')
  })

  it('suffixes a name that another declaration already took', () => {
    const resolver = createPartsResolver()
    resolver.reserveNames(['ListPetsQuery'])

    expect(resolver.param.query(node)).toBe('ListPetsQuery2')
  })

  it('keys generic operations without a pointer by operationId, so they do not share a name', () => {
    const resolver = createPartsResolver()
    const listCats = ast.factory.createOperation({ operationId: 'listCats' })
    const listDogs = ast.factory.createOperation({ operationId: 'listDogs' })

    expect([resolver.param.query(listCats), resolver.param.query(listDogs)]).toStrictEqual(['ListCatsQuery', 'ListDogsQuery'])
  })

  it('cases the file name and nests dotted names', () => {
    const resolver = createPartsResolver()
    const file = resolver.file({ name: 'pet.petId', extname: '.ts', root: '/src', output: { path: 'types', mode: 'directory' } })

    expect(file.path).toBe('/src/types/pet/PetId.ts')
  })

  it('lets a patch replace one method and keep the rest of the part', () => {
    const resolver = Resolver.merge(createPartsResolver(), {
      response: {
        status(node: ast.OperationNode, statusCode: ast.StatusCode) {
          return `${node.operationId}${statusCode}`
        },
      },
    } as never)

    expect(resolver.response.status(node, '200')).toBe('listPets200')
    expect(resolver.response.body(node)).toBe('ListPetsBody')
  })
})
