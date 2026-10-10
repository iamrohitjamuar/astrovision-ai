export type Insight = { area: string; headline: string; detail: string; confidence: string }

export type Reading = {
  id: string
  name: string
  readingType: string
  birthDate?: string
  birthTime?: string
  birthPlace?: string
  imageName?: string
  zodiacSign?: string
  title: string
  summary: string
  insights: Insight[]
  recommendations: string[]
  mode: string
  createdAt: string
  imageData?: string
  imageMimeType?: string
}

export type Kind = 'PALM' | 'FACE' | 'HOROSCOPE' | 'COMBINED'
export type AiStatus = { mode?: string; configuredModel?: string; reachable?: boolean; modelAvailable?: boolean; message?: string }
export type CreateReadingPayload = {
  name: string
  readingType: Kind
  birthDate?: string
  birthTime?: string
  birthPlace?: string
  imageName?: string
  imageMimeType?: string
  imageData?: string
}
