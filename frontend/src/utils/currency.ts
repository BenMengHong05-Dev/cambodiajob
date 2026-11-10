import { Currency } from '../types'

export const KHR_PER_USD = 4100

export const formatCurrencyAmount = (amount: number, currency: Currency): string => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return (
    new Intl.NumberFormat('km-KH', {
      maximumFractionDigits: 0,
    }).format(amount) + ' ៛'
  )
}

export const formatSalaryRange = (
  min?: number | null,
  max?: number | null,
  currency: Currency = 'USD',
  isNegotiable: boolean = false,
  negotiableLabel: string = 'Negotiable'
): string => {
  if (isNegotiable && !min && !max) {
    return negotiableLabel
  }

  if (min && max) {
    if (currency === 'USD') {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    }
    return `${min.toLocaleString()} - ${max.toLocaleString()} ៛`
  }

  if (min) {
    if (currency === 'USD') {
      return `From $${min.toLocaleString()}`
    }
    return `ចាប់ពី ${min.toLocaleString()} ៛`
  }

  if (max) {
    if (currency === 'USD') {
      return `Up to $${max.toLocaleString()}`
    }
    return `រហូតដល់ ${max.toLocaleString()} ៛`
  }

  return negotiableLabel
}

