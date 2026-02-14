import type { Template, CardData, PracticeAttempt, PracticeHistory } from './types'

function getApi() {
  if (typeof window === 'undefined' || !window.electron) {
    return null
  }
  return window.electron
}

export async function getTemplates(): Promise<Template[]> {
  const api = getApi()
  if (!api) return []
  return api.getTemplates()
}

export async function getTemplate(id: string): Promise<Template | null> {
  const api = getApi()
  if (!api) return null
  return api.getTemplate(id)
}

export async function saveTemplate(id: string, content: string): Promise<Template | null> {
  const api = getApi()
  if (!api) return null
  return api.saveTemplate(id, content)
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const api = getApi()
  if (!api) return false
  return api.deleteTemplate(id)
}

export async function getAllFsrsData(): Promise<Record<string, CardData>> {
  const api = getApi()
  if (!api) return {}
  return api.getFsrsData()
}

export async function getFsrsCard(id: string): Promise<CardData | null> {
  const api = getApi()
  if (!api) return null
  return api.getFsrsCard(id)
}

export async function saveFsrsCard(id: string, card: CardData): Promise<boolean> {
  const api = getApi()
  if (!api) return false
  return api.saveFsrsCard(id, card)
}

export async function getPracticeHistory(id: string): Promise<PracticeAttempt[]> {
  const api = getApi()
  if (!api) return []
  return api.getPracticeHistory(id)
}

export async function savePracticeAttempt(id: string, attempt: PracticeAttempt): Promise<boolean> {
  const api = getApi()
  if (!api) return false
  return api.savePracticeAttempt(id, attempt)
}

export async function getAllPracticeHistory(): Promise<PracticeHistory> {
  const api = getApi()
  if (!api) return {}
  return api.getAllPracticeHistory()
}
