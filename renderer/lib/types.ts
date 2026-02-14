import type { Card, RecordLogItem } from 'ts-fsrs'

export interface Template {
  id: string
  filename: string
  content: string
}

export interface CardData {
  card: Card
  lastReview?: string
}

export interface PracticeResult {
  templateId: string
  wpm: number
  accuracy: number
  errors: number
  totalChars: number
  timeMs: number
}

export interface PracticeAttempt {
  timestamp: string
  wpm: number
  cpm: number
  accuracy: number
  errors: number
  totalChars: number
  timeMs: number
}

export type PracticeHistory = Record<string, PracticeAttempt[]>

export interface ElectronAPI {
  getTemplates: () => Promise<Template[]>
  getTemplate: (id: string) => Promise<Template | null>
  saveTemplate: (id: string, content: string) => Promise<Template>
  deleteTemplate: (id: string) => Promise<boolean>
  getFsrsData: () => Promise<Record<string, CardData>>
  getFsrsCard: (id: string) => Promise<CardData | null>
  saveFsrsCard: (id: string, card: CardData) => Promise<boolean>
  getPracticeHistory: (id: string) => Promise<PracticeAttempt[]>
  savePracticeAttempt: (id: string, attempt: PracticeAttempt) => Promise<boolean>
  getAllPracticeHistory: () => Promise<PracticeHistory>
  onMenuAction: (callback: (payload: any) => void) => void
  setWindowTitle: (title: string) => Promise<boolean>
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
