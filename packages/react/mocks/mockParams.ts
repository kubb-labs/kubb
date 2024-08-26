import type { Params } from '../src/types.ts'

export const mockParams: Array<{ name: string; params: Params }> = [
  {
    name: 'empty',
    params: {
      name: {},
    },
  },
  {
    name: 'string',
    params: {
      name: {
        type: 'string',
      },
    },
  },
  {
    name: 'optional string',
    params: {
      name: {
        type: 'string',
        optional: true,
      },
    },
  },
  {
    name: 'default string',
    params: {
      name: {
        type: 'string',
        default: 'test',
      },
    },
  },
  {
    name: 'undefined',
    params: {
      name: undefined,
    },
  },
  {
    name: 'name and address',
    params: {
      name: {
        type: 'string',
      },
      address: {
        type: 'string',
      },
    },
  },
  {
    name: 'name[optional], age[optional] and address',
    params: {
      name: {
        type: 'string',
        optional: true,
      },
      age: {
        type: 'number',
        optional: true,
      },
      address: {
        type: 'string',
      },
    },
  },
  {
    name: 'name[optional] age, address[optional] and country[Belgium]',
    params: {
      name: {
        type: 'string',
        optional: true,
      },
      age: {
        type: 'number',
      },
      address: {
        type: 'string',
        optional: true,
      },
      country: {
        type: 'string',
        default: '"Belgium"',
      },
    },
  },
  {
    name: 'params[with name] with age, address[optional] and country',
    params: {
      data: {
        type: 'Data',
        children: {
          age: {
            type: 'number',
          },
          address: {
            type: 'string',
            optional: true,
          },
          country: {
            type: 'string',
          },
        },
      },
    },
  },
  {
    name: 'params[without name] with age, address[optional] and country',
    params: {
      data: {
        children: {
          age: {
            type: 'number',
          },
          address: {
            type: 'string',
            optional: true,
          },
          country: {
            type: 'string',
          },
        },
      },
    },
  },
  {
    name: 'undefined children param',
    params: {
      data: {
        children: {
          age: undefined,
        },
      },
    },
  },
  {
    name: 'empty children param',
    params: {
      data: {
        children: {
          age: {},
        },
      },
    },
  },
  {
    name: 'params[without name and default] with age[optional, 90] address[optional] and country[optional, Belgium]',
    params: {
      data: {
        default: '{}',
        children: {
          age: {
            type: 'number',
            default: '90',
            optional: true,
          },
          address: {
            type: 'string',
            optional: true,
          },
          country: {
            type: 'string',
            default: "'Belgium'",
            optional: true,
          },
        },
      },
    },
  },
  {
    name: 'params[without name] with age[optional, 20] address[optional] and country[optional, Belgium]',
    params: {
      data: {
        children: {
          age: {
            type: 'number',
            default: '20',
            optional: true,
          },
          address: {
            type: 'string',
            optional: true,
          },
          country: {
            type: 'string',
            default: '"Belgium"',
            optional: true,
          },
        },
      },
    },
  },
  {
    name: 'params[without name and mode inline] with age[optional, 20] address[optional] and country[optional, Belgium]',
    params: {
      data: {
        mode: 'inline',
        children: {
          age: {
            type: 'number',
            default: '20',
            optional: true,
          },
          address: {
            type: 'string',
            optional: true,
          },
          country: {
            type: 'string',
            default: '"Belgium"',
            optional: true,
          },
        },
      },
    },
  },
  {
    name: 'params[without name and mode inline] with age[20] address and country[Belgium]',
    params: {
      data: {
        mode: 'inline',
        children: {
          age: {
            type: 'number',
            default: '20',
          },
          address: {
            type: 'string',
          },
          country: {
            type: 'string',
            default: '"Belgium"',
          },
        },
      },
    },
  },
  {
    name: 'params[without name and mode inlineSpread] with age[20] address and country[Belgium]',
    params: {
      data: {
        mode: 'inlineSpread',
        children: {
          age: {
            type: 'number',
            default: '20',
          },
          address: {
            type: 'string',
          },
          country: {
            type: 'string',
            default: '"Belgium"',
          },
        },
      },
    },
  },
]
