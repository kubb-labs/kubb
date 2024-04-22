import type { Call, Objects, Tuples } from 'hotscript'

type Checks = {
  Security: { security: { [key: string]: any }[] }

  AuthParams: {
    Basic:
      | {
          type: 'http'
          scheme: 'basic'
        }
      | { type: 'basic' }
    Bearer:
      | {
          type: 'http'
          scheme: 'bearer'
        }
      | { type: 'bearer' }

    OAuth2: {
      type: 'oauth2'
    }
    ApiKey: {
      type: 'apiKey'
      in: 'header'
    }
  }

  AuthName: {
    Basic: `basic${string}`
    Bearer: `bearer${string}`
    OAuth2: `oauth${string}`
  }
}

type SecuritySchemeName<T extends Checks['Security']> = Call<Tuples.Map<Objects.Keys>, T['security']>[number]

namespace AuthParams {
  export type Basic<TSecurityScheme> = TSecurityScheme extends Checks['AuthParams']['Basic']
    ? {
        headers: {
          /**
           * `Authorization` header is required for basic authentication
           * @see https://en.wikipedia.org/wiki/Basic_access_authentication
           *
           * It contains the word `Basic` followed by a space and a base64-encoded string `username:password`
           *
           * @example
           * ```
           * Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==
           * ```
           */
          Authorization: `Basic ${string}`
        }
      }
    : {}

  export type Bearer<TSecurityScheme> = TSecurityScheme extends Checks['AuthParams']['Bearer']
    ? {
        /**
         * `Authorization` header is required for bearer authentication
         * @see https://swagger.io/docs/specification/authentication/bearer-authentication/
         */
        headers: {
          /**
           * It contains the word `Bearer` followed by a space and the token
           *
           * @example
           * ```
           * Authorization: Bearer {token}
           * ```
           */
          Authorization: `Bearer ${string}`
        }
      }
    : {}

  export type ApiKey<TSecurityScheme> = TSecurityScheme extends Checks['AuthParams']['ApiKey'] & {
    name: infer TApiKeyHeaderName
  }
    ? {
        headers: {
          /**
           * Header required for API key authentication
           */
          [THeaderName in TApiKeyHeaderName extends string ? TApiKeyHeaderName : never]: string
        }
      }
    : TSecurityScheme extends {
          type: 'apiKey'
          in: 'query'
          name: infer TApiKeyQueryName
        }
      ? {
          query: {
            /**
             * Query parameter required for API key authentication
             */
            [TQueryName in TApiKeyQueryName extends string ? TApiKeyQueryName : never]: string
          }
        }
      : {}

  export type OAuth2<TSecurityScheme> = TSecurityScheme extends Checks['AuthParams']['OAuth2']
    ? {
        /**
         * `Authorization` header is required for OAuth2.
         */
        headers: {
          /**
           * The access token string as issued by the authorization server.
           * @example `Authorization: Bearer <access_token>`
           */
          Authorization: `Bearer ${string}`
        }
      }
    : {}
}

type OASSecurityParams<TSecurityScheme> = AuthParams.Basic<TSecurityScheme> &
  AuthParams.Bearer<TSecurityScheme> &
  AuthParams.ApiKey<TSecurityScheme> &
  AuthParams.OAuth2<TSecurityScheme>

export type SecurityParamsBySecurityRef<TOAS, TSecurityObj> = TSecurityObj extends Checks['Security']
  ? TOAS extends
      | {
          components: {
            securitySchemes: {
              [TSecuritySchemeNameKey in SecuritySchemeName<TSecurityObj> extends string ? SecuritySchemeName<TSecurityObj> : never]: infer TSecurityScheme
            }
          }
        }
      | {
          securityDefinitions: {
            [TSecuritySchemeNameKey in SecuritySchemeName<TSecurityObj> extends string ? SecuritySchemeName<TSecurityObj> : never]: infer TSecurityScheme
          }
        }
    ? OASSecurityParams<TSecurityScheme>
    : // OAS may have a bad reference to a security scheme
      // So we can assume it
      SecuritySchemeName<TSecurityObj> extends Checks['AuthName']['Basic']
      ? AuthParams.Basic<{
          type: 'http'
          scheme: 'basic'
        }>
      : SecuritySchemeName<TSecurityObj> extends Checks['AuthName']['Bearer']
        ? AuthParams.Bearer<{
            type: 'http'
            scheme: 'bearer'
          }>
        : SecuritySchemeName<TSecurityObj> extends Checks['AuthName']['OAuth2']
          ? AuthParams.OAuth2<{
              type: 'oauth2'
            }>
          : {}
  : {}
