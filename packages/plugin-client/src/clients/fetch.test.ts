import { beforeEach, describe, expect, it, vi } from 'vitest'
import { client, getConfig, setConfig } from './fetch'

// Mock the global fetch
vi.stubGlobal('fetch', vi.fn())

describe('fetch client', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockClear()
    setConfig({})
  })

  describe('FormData handling', () => {
    it('should pass FormData directly without JSON.stringify', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }))
      formData.append('name', 'test-file.txt')

      vi.mocked(fetch).mockResolvedValue({
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

      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        '/upload',
        expect.objectContaining({
          method: 'POST',
          body: formData,
        }),
      )

      // Verify that the body is the actual FormData instance, not a stringified version
      const callArgs = vi.mocked(fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(callArgs?.[1]?.body).toBeInstanceOf(FormData)
      expect(callArgs?.[1]?.body).toBe(formData)
    })

    it('should JSON.stringify regular objects', async () => {
      const data = { name: 'John', age: 30 }

      vi.mocked(fetch).mockResolvedValue({
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

      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        }),
      )

      // Verify that the body is a string
      const callArgs = vi.mocked(fetch).mock.calls[0]
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

      vi.mocked(fetch).mockResolvedValue({
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

      const callArgs = vi.mocked(fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(callArgs?.[1]?.body).toBeInstanceOf(FormData)
      expect(callArgs?.[1]?.body).toBe(formData)
    })

    it('should handle empty FormData', async () => {
      const formData = new FormData()

      vi.mocked(fetch).mockResolvedValue({
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

      const callArgs = vi.mocked(fetch).mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(callArgs?.[1]?.body).toBeInstanceOf(FormData)
    })
  })

  describe('basic functionality', () => {
    it('should make a GET request', async () => {
      vi.mocked(fetch).mockResolvedValue({
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

      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
        }),
      )
      expect(response.data).toEqual({ data: 'test' })
    })

    it('should handle query parameters', async () => {
      vi.mocked(fetch).mockResolvedValue({
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

      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        '/api/search?q=test&page=1',
        expect.any(Object),
      )
    })

    it('should merge baseURL with url', async () => {
      vi.mocked(fetch).mockResolvedValue({
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

      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object),
      )
    })

    it('should use global config', async () => {
      setConfig({
        baseURL: 'https://api.example.com',
        headers: { Authorization: 'Bearer token' },
      })

      vi.mocked(fetch).mockResolvedValue({
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

      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
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
      vi.mocked(fetch).mockResolvedValue({
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
