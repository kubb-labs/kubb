import type { Infer } from '@kubb/oas'

export const oas = {
  openapi: '3.0.3',
  info: {
    title: 'Swagger Petstore - OpenAPI 3.0',
    description:
      "This is a sample Pet Store Server based on the OpenAPI 3.0 specification.  You can find out more about\nSwagger at [https://swagger.io](https://swagger.io). In the third iteration of the pet store, we've switched to the design first approach!\nYou can now help us improve the API whether it's by making changes to the definition itself or to the code.\nThat way, with time, we can improve the API in general, and expose some of the new features in OAS3.\n\nSome useful links:\n- [The Pet Store repository](https://github.com/swagger-api/swagger-petstore)\n- [The source API definition for the Pet Store](https://github.com/swagger-api/swagger-petstore/blob/master/src/main/resources/openapi.yaml)",
    termsOfService: 'http://swagger.io/terms/',
    contact: {
      email: 'apiteam@swagger.io',
    },
    license: {
      name: 'Apache 2.0',
      url: 'http://www.apache.org/licenses/LICENSE-2.0.html',
    },
    version: '1.0.11',
  },
  servers: [
    {
      url: 'https://petstore3.swagger.io/api/v3',
    },
  ],
  paths: {
    '/pet': {
      put: {
        operationId: 'updatePet',
        summary: 'Update an existing pet',
        description: 'Update an existing pet by Id',
        requestBody: {
          description: 'Update an existent pet in the store',
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Pet',
              },
            },
            'application/x-www-form-urlencoded': {
              schema: {
                $ref: '#/components/schemas/Pet',
              },
            },
            'application/xml': {
              schema: {
                $ref: '#/components/schemas/Pet',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Pet',
                },
              },
              'application/xml': {
                schema: {
                  $ref: '#/components/schemas/Pet',
                },
              },
            },
          },
          '400': {
            description: 'Invalid ID supplied',
          },
          '404': {
            description: 'Pet not found',
          },
          '405': {
            description: 'Validation exception',
          },
        },
        security: [
          {
            petstore_auth: ['write:pets', 'read:pets'],
          },
        ],
        tags: ['pet'],
      },
      post: {
        operationId: 'addPet',
        summary: 'Add a new pet to the store',
        description: 'Add a new pet to the store',
        requestBody: {
          description: 'Create a new pet in the store',
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AddPetRequest',
              },
            },
            'application/x-www-form-urlencoded': {
              schema: {
                $ref: '#/components/schemas/Pet',
              },
            },
            'application/xml': {
              schema: {
                $ref: '#/components/schemas/Pet',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Pet',
                },
              },
              'application/xml': {
                schema: {
                  $ref: '#/components/schemas/Pet',
                },
              },
            },
          },
          '405': {
            description: 'Pet not found',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    code: {
                      type: 'integer',
                      format: 'int32',
                    },
                    message: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
        security: [
          {
            petstore_auth: ['write:pets', 'read:pets'],
          },
        ],
        tags: ['pet'],
      },
    },
    '/pet/findByStatus': {
      get: {
        operationId: 'findPetsByStatus',
        summary: 'Finds Pets by status',
        description: 'Multiple status values can be provided with comma separated strings',
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Status values that need to be considered for filter',
            required: false,
            schema: {
              type: 'string',
              default: 'available',
              enum: ['available', 'pending', 'sold'],
            },
            explode: true,
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Pet',
                  },
                },
              },
              'application/xml': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Pet',
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid status value',
          },
        },
        security: [
          {
            petstore_auth: ['write:pets', 'read:pets'],
          },
        ],
        tags: ['pet'],
      },
    },
    '/pet/findByTags': {
      get: {
        operationId: 'findPetsByTags',
        summary: 'Finds Pets by tags',
        description: 'Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.',
        parameters: [
          {
            name: 'tags',
            in: 'query',
            description: 'Tags to filter by',
            required: false,
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            explode: true,
          },
          {
            $ref: '#/components/parameters/page',
          },
          {
            $ref: '#/components/parameters/pageSize',
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Pet',
                  },
                },
              },
              'application/xml': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Pet',
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid tag value',
          },
        },
        security: [
          {
            petstore_auth: ['write:pets', 'read:pets'],
          },
        ],
        tags: ['pet'],
      },
    },
    '/pet/{petId}': {
      get: {
        operationId: 'getPetById',
        summary: 'Find pet by ID',
        description: 'Returns a single pet',
        parameters: [
          {
            name: 'petId',
            in: 'path',
            description: 'ID of pet to return',
            required: true,
            schema: {
              type: 'integer',
              format: 'int64',
            },
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Pet',
                },
              },
              'application/xml': {
                schema: {
                  $ref: '#/components/schemas/Pet',
                },
              },
            },
          },
          '400': {
            description: 'Invalid ID supplied',
          },
          '404': {
            description: 'Pet not found',
          },
        },
        security: [
          {
            api_key: [],
          },
          {
            petstore_auth: ['write:pets', 'read:pets'],
          },
        ],
        tags: ['pet'],
      },
      post: {
        operationId: 'updatePetWithForm',
        summary: 'Updates a pet in the store with form data',
        description: '',
        parameters: [
          {
            name: 'petId',
            in: 'path',
            description: 'ID of pet that needs to be updated',
            required: true,
            schema: {
              type: 'integer',
              format: 'int64',
            },
          },
          {
            name: 'name',
            in: 'query',
            description: 'Name of pet that needs to be updated',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Status of pet that needs to be updated',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '405': {
            description: 'Invalid input',
          },
        },
        security: [
          {
            petstore_auth: ['write:pets', 'read:pets'],
          },
        ],
        tags: ['pet'],
      },
      delete: {
        operationId: 'deletePet',
        summary: 'Deletes a pet',
        description: 'delete a pet',
        parameters: [
          {
            name: 'api_key',
            in: 'header',
            description: '',
            required: false,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'petId',
            in: 'path',
            description: 'Pet id to delete',
            required: true,
            schema: {
              type: 'integer',
              format: 'int64',
            },
          },
        ],
        responses: {
          '400': {
            description: 'Invalid pet value',
          },
        },
        security: [
          {
            petstore_auth: ['write:pets', 'read:pets'],
          },
        ],
        tags: ['pet'],
      },
    },
    '/pet/{petId}/uploadImage': {
      post: {
        operationId: 'uploadFile',
        summary: 'uploads an image',
        description: '',
        parameters: [
          {
            name: 'petId',
            in: 'path',
            description: 'ID of pet to update',
            required: true,
            schema: {
              type: 'integer',
              format: 'int64',
            },
          },
          {
            name: 'additionalMetadata',
            in: 'query',
            description: 'Additional Metadata',
            required: false,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          content: {
            'application/octet-stream': {
              schema: {
                type: 'string',
                format: 'binary',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse',
                },
              },
            },
          },
        },
        security: [
          {
            petstore_auth: ['write:pets', 'read:pets'],
          },
        ],
        tags: ['pet'],
      },
    },
    '/store/inventory': {
      get: {
        operationId: 'getInventory',
        summary: 'Returns pet inventories by status',
        description: 'Returns a map of status codes to quantities',
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: {
                    type: 'integer',
                    format: 'int32',
                  },
                },
              },
            },
          },
        },
        security: [
          {
            api_key: [],
          },
        ],
        tags: ['store'],
      },
    },
    '/store/order': {
      post: {
        operationId: 'placeOrder',
        summary: 'Place an order for a pet',
        description: 'Place a new order in the store',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Order',
              },
            },
            'application/x-www-form-urlencoded': {
              schema: {
                $ref: '#/components/schemas/Order',
              },
            },
            'application/xml': {
              schema: {
                $ref: '#/components/schemas/Order',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Order',
                },
              },
            },
          },
          '405': {
            description: 'Invalid input',
          },
        },
        tags: ['store'],
      },
      patch: {
        operationId: 'placeOrderPatch',
        summary: 'Place an order for a pet with patch',
        description: 'Place a new order in the store with patch',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Order',
              },
            },
            'application/x-www-form-urlencoded': {
              schema: {
                $ref: '#/components/schemas/Order',
              },
            },
            'application/xml': {
              schema: {
                $ref: '#/components/schemas/Order',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Order',
                },
              },
            },
          },
          '405': {
            description: 'Invalid input',
          },
        },
        tags: ['store'],
      },
    },
    '/store/order/{orderId}': {
      get: {
        operationId: 'getOrderById',
        summary: 'Find purchase order by ID',
        description: 'For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.',
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            description: 'ID of order that needs to be fetched',
            required: true,
            schema: {
              type: 'integer',
              format: 'int64',
            },
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Order',
                },
              },
              'application/xml': {
                schema: {
                  $ref: '#/components/schemas/Order',
                },
              },
            },
          },
          '400': {
            description: 'Invalid ID supplied',
          },
          '404': {
            description: 'Order not found',
          },
        },
        tags: ['store'],
      },
      delete: {
        operationId: 'deleteOrder',
        summary: 'Delete purchase order by ID',
        description: 'For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors',
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            description: 'ID of the order that needs to be deleted',
            required: true,
            schema: {
              type: 'integer',
              format: 'int64',
            },
          },
        ],
        responses: {
          '400': {
            description: 'Invalid ID supplied',
          },
          '404': {
            description: 'Order not found',
          },
        },
        tags: ['store'],
      },
    },
    '/user': {
      post: {
        operationId: 'createUser',
        summary: 'Create user',
        description: 'This can only be done by the logged in user.',
        requestBody: {
          description: 'Created user object',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
            'application/x-www-form-urlencoded': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
            'application/xml': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
        responses: {
          default: {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
              'application/xml': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
        tags: ['user'],
      },
    },
    '/user/createWithList': {
      post: {
        operationId: 'createUsersWithListInput',
        summary: 'Creates list of users with given input array',
        description: 'Creates list of users with given input array',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
              'application/xml': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          default: {
            description: 'successful operation',
          },
        },
        tags: ['user'],
      },
    },
    '/user/login': {
      get: {
        operationId: 'loginUser',
        summary: 'Logs user into the system',
        description: '',
        parameters: [
          {
            name: 'username',
            in: 'query',
            description: 'The user name for login',
            required: false,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'password',
            in: 'query',
            description: 'The password for login in clear text',
            required: false,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            headers: {
              'X-Rate-Limit': {
                description: 'calls per hour allowed by the user',
                schema: {
                  type: 'integer',
                  format: 'int32',
                },
              },
              'X-Expires-After': {
                description: 'date in UTC when token expires',
                schema: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'string',
                },
              },
              'application/xml': {
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '400': {
            description: 'Invalid username/password supplied',
          },
        },
        tags: ['user'],
      },
    },
    '/user/logout': {
      get: {
        operationId: 'logoutUser',
        summary: 'Logs out current logged in user session',
        description: '',
        parameters: [],
        responses: {
          default: {
            description: 'successful operation',
          },
        },
        tags: ['user'],
      },
    },
    '/user/{username}': {
      get: {
        operationId: 'getUserByName',
        summary: 'Get user by user name',
        description: '',
        parameters: [
          {
            name: 'username',
            in: 'path',
            description: 'The name that needs to be fetched. Use user1 for testing. ',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
              'application/xml': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          '400': {
            description: 'Invalid username supplied',
          },
          '404': {
            description: 'User not found',
          },
        },
        tags: ['user'],
      },
      put: {
        operationId: 'updateUser',
        summary: 'Update user',
        description: 'This can only be done by the logged in user.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            description: 'name that need to be deleted',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          description: 'Update an existent user in the store',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
            'application/x-www-form-urlencoded': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
            'application/xml': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
        responses: {
          default: {
            description: 'successful operation',
          },
        },
        tags: ['user'],
      },
      delete: {
        operationId: 'deleteUser',
        summary: 'Delete user',
        description: 'This can only be done by the logged in user.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            description: 'The name that needs to be deleted',
            required: true,
            schema: {
              type: 'string',
              nullable: true,
            },
          },
        ],
        responses: {
          '400': {
            description: 'Invalid username supplied',
          },
          '404': {
            description: 'User not found',
          },
        },
        tags: ['user'],
      },
    },
  },
  components: {
    parameters: {
      page: {
        description: 'to request with required page number or pagination',
        in: 'query',
        name: 'page',
        required: false,
        schema: {
          type: 'string',
        },
      },
      pageSize: {
        description: 'to request with required page size',
        in: 'query',
        name: 'pageSize',
        required: false,
        schema: {
          type: 'string',
        },
      },
    },
    schemas: {
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
            example: 10,
          },
          petId: {
            type: 'integer',
            format: 'int64',
            example: 198772,
          },
          quantity: {
            type: 'integer',
            format: 'int32',
            example: 7,
          },
          shipDate: {
            type: 'string',
            format: 'date-time',
          },
          status: {
            description: 'Order Status',
            type: 'string',
            example: 'approved',
            enum: ['placed', 'approved', 'delivered'],
          },
          http_status: {
            description: 'HTTP Status',
            type: 'number',
            example: 200,
            enum: [200, 400, 500],
          },
          complete: {
            type: 'boolean',
          },
        },
        xml: {
          name: 'order',
        },
      },
      Customer: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
            example: 100000,
          },
          username: {
            type: 'string',
            example: 'fehguy',
          },
          address: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Address',
            },
            xml: {
              name: 'addresses',
              wrapped: true,
            },
          },
        },
        xml: {
          name: 'customer',
        },
      },
      Address: {
        type: 'object',
        properties: {
          street: {
            type: 'string',
            example: '437 Lytton',
          },
          city: {
            type: 'string',
            example: 'Palo Alto',
          },
          state: {
            type: 'string',
            example: 'CA',
          },
          zip: {
            type: 'string',
            example: '94301',
          },
        },
        xml: {
          name: 'address',
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
            example: 1,
          },
          name: {
            type: 'string',
            example: 'Dogs',
          },
        },
        xml: {
          name: 'category',
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
            example: 10,
          },
          username: {
            type: 'string',
            example: 'theUser',
          },
          firstName: {
            type: 'string',
            example: 'John',
          },
          lastName: {
            type: 'string',
            example: 'James',
          },
          email: {
            type: 'string',
            example: 'john@email.com',
          },
          password: {
            type: 'string',
            example: '12345',
          },
          phone: {
            type: 'string',
            example: '12345',
          },
          userStatus: {
            description: 'User Status',
            type: 'integer',
            format: 'int32',
            example: 1,
          },
        },
        xml: {
          name: 'user',
        },
      },
      Tag: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
          name: {
            type: 'string',
          },
        },
        xml: {
          name: 'tag',
        },
      },
      Pet: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
            example: 10,
          },
          name: {
            type: 'string',
            example: 'doggie',
          },
          category: {
            $ref: '#/components/schemas/Category',
          },
          photoUrls: {
            type: 'array',
            items: {
              type: 'string',
              xml: {
                name: 'photoUrl',
              },
            },
            xml: {
              wrapped: true,
            },
          },
          tags: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Tag',
            },
            xml: {
              wrapped: true,
            },
          },
          status: {
            description: 'pet status in the store',
            type: 'string',
            enum: ['available', 'pending', 'sold'],
          },
        },
        required: ['name', 'photoUrls'],
        xml: {
          name: 'pet',
        },
      },
      AddPetRequest: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
            example: 10,
          },
          name: {
            type: 'string',
            example: 'doggie',
          },
          category: {
            $ref: '#/components/schemas/Category',
          },
          photoUrls: {
            type: 'array',
            items: {
              type: 'string',
              xml: {
                name: 'photoUrl',
              },
            },
            xml: {
              wrapped: true,
            },
          },
          tags: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Tag',
            },
            xml: {
              wrapped: true,
            },
          },
          status: {
            description: 'pet status in the store',
            type: 'string',
            enum: ['available', 'pending', 'sold'],
          },
        },
        required: ['name', 'photoUrls'],
        xml: {
          name: 'pet',
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          code: {
            type: 'integer',
            format: 'int32',
          },
          type: {
            type: 'string',
          },
          message: {
            type: 'string',
          },
        },
        xml: {
          name: '##default',
        },
      },
    },
    requestBodies: {
      Pet: {
        description: 'Pet object that needs to be added to the store',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Pet',
            },
          },
          'application/xml': {
            schema: {
              $ref: '#/components/schemas/Pet',
            },
          },
        },
      },
      UserArray: {
        description: 'List of user object',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
      },
    },
    responses: {
      PetNotFound: {
        description: 'Pet not found',
        content: {
          'application/json': {
            schema: {
              properties: {
                code: {
                  type: 'integer',
                  format: 'int32',
                },
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    securitySchemes: {
      petstore_auth: {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://petstore3.swagger.io/oauth/authorize',
            scopes: {
              'write:pets': 'modify pets in your account',
              'read:pets': 'read your pets',
            },
          },
        },
      },
      api_key: {
        type: 'apiKey',
        name: 'api_key',
        in: 'header',
      },
    },
  },
  tags: [
    {
      name: 'pet',
      description: 'Everything about your Pets',
      externalDocs: {
        description: 'Find out more',
        url: 'http://swagger.io',
      },
    },
    {
      name: 'store',
      description: 'Access to Petstore orders',
      externalDocs: {
        description: 'Find out more about our store',
        url: 'http://swagger.io',
      },
    },
    {
      name: 'user',
      description: 'Operations about user',
    },
  ],
  externalDocs: {
    description: 'Find out more about Swagger',
    url: 'http://swagger.io',
  },
} as const
export type Oas = Infer<typeof oas>
