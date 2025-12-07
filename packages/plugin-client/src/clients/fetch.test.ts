import { beforeEach, describe, expect, it, vi } from 'vitest'
import { client, getConfig, setConfig } from './fetch'

// Mock the global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('fetch client', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    setConfig({})
  })

  describe('FormData handling', () => {
    it('should pass FormData directly without JSON.stringify', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }))
      formData.append('name', 'test-file.txt')

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: {},
        json: async () => ({ success: true }),
      })

      await client({
        url: '/upload',
        method: 'POST',
        data: formData,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/upload',
        expect.objectContaining({
          method: 'POST',
          body: formData,
        }),
      )

      // Verify that the body is the actual FormData instance, not a stringified version
      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(callArgs?.[1]?.body).toBeInstanceOf(FormData)
      expect(callArgs?.[1]?.body).toBe(formData)
    })

    it('should JSON.stringify regular objects', async () => {
      const data = { name: 'John', age: 30 }

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: {},
        json: async () => ({ success: true }),
      })

      await client({
        url: '/api/users',
        method: 'POST',
        data,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        }),
      )

      // Verify that the body is a string
      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(typeof callArgs?.[1]?.body).toBe('string')
      expect(callArgs?.[1]?.body).toBe('{"name":"John","age":30}')
    })

    it('should handle FormData with multiple files', async () => {
      const formData = new FormData()
      const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' })
      const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' })
      formData.append('files', file1)
      formData.append('files', file2)
      formData.append('description', 'Multiple files upload')

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: {},
        json: async () => ({ success: true }),
      })

      await client({
        url: '/upload-multiple',
        method: 'POST',
        data: formData,
      })

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(callArgs?.[1]?.body).toBeInstanceOf(FormData)
      expect(callArgs?.[1]?.body).toBe(formData)
    })

    it('should handle empty FormData', async () => {
      const formData = new FormData()

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: {},
        json: async () => ({ success: true }),
      })

      await client({
        url: '/upload',
        method: 'POST',
        data: formData,
      })

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(callArgs?.[1]?.body).toBeInstanceOf(FormData)
    })
  })

  describe('multiple content types', () => {
    it('should send XML data as string without JSON.stringify', async () => {
      const xmlData = '<pet><name>Fluffy</name><status>available</status></pet>'

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/xml' }),
        body: {},
        text: async () => '<response><success>true</success></response>',
      })

      await client({
        url: '/api/pets',
        method: 'POST',
        data: xmlData,
        headers: { 'Content-Type': 'application/xml' },
      })

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(callArgs?.[1]?.body).toBe(xmlData)
      expect(typeof callArgs?.[1]?.body).toBe('string')
    })

    it('should convert object to URLSearchParams for application/x-www-form-urlencoded', async () => {
      const formData = { name: 'Fluffy', status: 'available', age: 3 }

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: {},
        json: async () => ({ success: true }),
      })

      await client({
        url: '/api/pets',
        method: 'POST',
        data: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(typeof callArgs?.[1]?.body).toBe('string')
      expect(callArgs?.[1]?.body).toContain('name=Fluffy')
      expect(callArgs?.[1]?.body).toContain('status=available')
      expect(callArgs?.[1]?.body).toContain('age=3')
    })

    it('should parse XML responses', async () => {
      const xmlResponse = '<pet><name>Fluffy</name></pet>'

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/xml' }),
        body: {},
        text: async () => xmlResponse,
      })

      const response = await client({
        url: '/api/pets/1',
        method: 'GET',
      })

      expect(response.data).toBe(xmlResponse)
    })

    it('should parse text responses', async () => {
      const textResponse = 'plain text response'

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/plain' }),
        body: {},
        text: async () => textResponse,
      })

      const response = await client({
        url: '/api/text',
        method: 'GET',
      })

      expect(response.data).toBe(textResponse)
    })

    it('should default to JSON parsing for unknown content types', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: {},
        json: async () => ({ data: 'test' }),
      })

      const response = await client({
        url: '/api/test',
        method: 'GET',
      })

      expect(response.data).toEqual({ data: 'test' })
    })
  })

  describe('basic functionality', () => {
    it('should make a GET request', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: {},
        json: async () => ({ data: 'test' }),
      })

      const response = await client({
        url: '/api/test',
        method: 'GET',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
        }),
      )
      expect(response.data).toEqual({ data: 'test' })
    })

    it('should handle query parameters', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: {},
        json: async () => ({}),
      })

      await client({
        url: '/api/search',
        method: 'GET',
        params: { q: 'test', page: 1 },
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/search?q=test&page=1', expect.any(Object))
    })

    it('should merge baseURL with url', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: {},
        json: async () => ({}),
      })

      await client({
        baseURL: 'https://api.example.com',
        url: '/users',
        method: 'GET',
      })

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', expect.any(Object))
    })

    it('should use global config', async () => {
      setConfig({
        baseURL: 'https://api.example.com',
        headers: { Authorization: 'Bearer token' },
      })

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: {},
        json: async () => ({}),
      })

      await client({
        url: '/users',
        method: 'GET',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: { Authorization: 'Bearer token' },
        }),
      )

      expect(getConfig()).toEqual({
        baseURL: 'https://api.example.com',
        headers: { Authorization: 'Bearer token' },
      })
    })

    it('should handle no content responses', async () => {
      mockFetch.mockResolvedValue({
        status: 204,
        statusText: 'No Content',
        headers: new Headers(),
        body: null,
      })

      const response = await client({
        url: '/api/delete',
        method: 'DELETE',
      })

      expect(response.data).toEqual({})
      expect(response.status).toBe(204)
    })
  })
})
