import { http } from 'msw'
import type {
  ListLinkedAccounts400,
  ListLinkedAccounts401,
  ListLinkedAccounts403,
  ListLinkedAccountsQueryResponse,
} from '../../models/ts/linkedAccountsController/ListLinkedAccounts.ts'

export function listLinkedAccountsHandlerResponse200(data: ListLinkedAccountsQueryResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function listLinkedAccountsHandlerResponse400(data?: ListLinkedAccounts400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function listLinkedAccountsHandlerResponse401(data?: ListLinkedAccounts401) {
  return new Response(JSON.stringify(data), {
    status: 401,
  })
}

export function listLinkedAccountsHandlerResponse403(data?: ListLinkedAccounts403) {
  return new Response(JSON.stringify(data), {
    status: 403,
  })
}

export function listLinkedAccountsHandler(
  data?: ListLinkedAccountsQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
) {
  return http.get('/v1/linked_accounts', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
