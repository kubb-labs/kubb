import type { AgentConnectResponse } from '~/types/agent.ts'

type ConnectProps = {
  studioUrl: string
  token: string
  noCache?: boolean
}

export async function connect({ token, studioUrl, noCache }: ConnectProps): Promise<AgentConnectResponse> {
  try {
    let data: AgentConnectResponse | null = null

    // Try to use cached session first (unless --no-cache is set)
    const cachedSession = !noCache ? getCachedSession(token) : null
    if (cachedSession) {
      console.log('Using cached agent session')
      data = cachedSession
    } else {
      // Fetch new session from Studio
      const connectUrl = `${studioUrl}/api/agent/connect`

      try {
        data = await $fetch<AgentConnectResponse>(connectUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Cache the session for reuse (unless --no-cache is set)
        if (data && !noCache) {
          cacheSession(token, data)
        }
      } catch (error) {
        throw new Error('Failed to get agent session from Kubb Studio', error)
      }
    }

    if (!data) {
      throw new Error('No data available for agent session')
    }

    return data
  } catch (error) {
    console.warn('Failed to connect:', error)

    throw error
  }
}

type DisconnectProps = {
  studioUrl: string
  token: string
  sessionToken: string
}

// Disconnect on process termination
export async function disconnect({ sessionToken, token, studioUrl }: DisconnectProps): Promise<void> {
  try {
    const disconnectUrl = `${studioUrl}/api/agent/session/${sessionToken}/disconnect`
    await $fetch(disconnectUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    console.log('Sent disconnect notification to Studio on exit')
  } catch (error) {
    console.warn('Failed to notify Studio of disconnection on exit:', error)
  }
}
