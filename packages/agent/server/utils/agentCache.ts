import type { JSONKubbConfig } from '~/types/agent.ts'

type Config = { config: JSONKubbConfig; storedAt: string }

function getStorage() {
  return useStorage<Config[]>('kubb')
}

/**
 * Saves studio config to storage with a unique timestamp-based key.
 * Each generation gets its own versioned entry for history/undo purposes.
 */
export async function saveStudioConfigToStorage({ sessionId, config }: { sessionId: string; config: JSONKubbConfig }): Promise<void> {
  const storage = getStorage()
  const key = `configs:${sessionId}`
  const existing = (await storage.getItem(key)) ?? []
  await storage.setItem(key, [...existing, { config, storedAt: new Date().toISOString() }])
}

/**
 * Returns the most recently saved studio config for the given session, or null if none exists.
 */
export async function getLatestStudioConfigFromStorage({ sessionId }: { sessionId: string }): Promise<JSONKubbConfig | null> {
  const storage = getStorage()
  const key = `configs:${sessionId}`
  const existing = await storage.getItem(key)
  if (!existing?.length) return null
  return existing[existing.length - 1].config
}
