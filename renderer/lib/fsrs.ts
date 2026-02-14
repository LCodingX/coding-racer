import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type RecordLogItem } from 'ts-fsrs'
import type { CardData } from './types'

const params = generatorParameters()
const scheduler = fsrs(params)

export { Rating }

export function createNewCard(): CardData {
  return {
    card: createEmptyCard(),
  }
}

export function scheduleReview(cardData: CardData, rating: Rating): CardData {
  const now = new Date()
  const result = scheduler.repeat(cardData.card, now)
  const scheduled = result[rating]

  return {
    card: scheduled.card,
    lastReview: now.toISOString(),
  }
}

export function isDue(cardData: CardData): boolean {
  const now = new Date()
  const due = new Date(cardData.card.due)
  return due <= now
}

export function getNextReviewDate(cardData: CardData): Date {
  return new Date(cardData.card.due)
}
