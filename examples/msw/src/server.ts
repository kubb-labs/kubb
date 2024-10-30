import { createServer } from '@mswjs/http-middleware'
import { setupServer } from 'msw/node'

import { handlers } from './gen/msw/handlers'

const server = createServer(...handlers)

server.listen(9090, () => {
  console.log('Mock server ready at http://localhost:9090')
  console.log('\n\n')
  setupServer(...handlers)
})
