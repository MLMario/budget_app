/**
 * Formatting Utilities
 *
 * Helper functions for formatting currency, dates, percentages, and other data types
 */

/**
 * Format a number as USD currency
 *
 * @param amount - The amount to format
 * @param options - Optional Intl.NumberFormat options
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(
  amount: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount)
}

/**
 * Format a number as compact currency (e.g., $1.2K, $1.5M)
 *
 * @param amount - The amount to format
 * @returns Compact formatted currency string
 */
export function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

/**
 * Format a date as a human-readable string
 *
 * @param date - Date string (YYYY-MM-DD) or Date object
 * @param format - Format type: 'short', 'medium', 'long', 'relative'
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  format: 'short' | 'medium' | 'long' | 'relative' = 'medium'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (format === 'relative') {
    return formatRelativeDate(dateObj)
  }

  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
  }[format]

  return new Intl.DateTimeFormat('en-US', options).format(dateObj)
}

/**
 * Format a date as a relative time string (e.g., "2 days ago", "in 3 weeks")
 *
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffInMs = date.getTime() - now.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === -1) {
    return 'Yesterday'
  } else if (diffInDays === 1) {
    return 'Tomorrow'
  } else if (diffInDays > 1 && diffInDays <= 7) {
    return `In ${diffInDays} days`
  } else if (diffInDays < -1 && diffInDays >= -7) {
    return `${Math.abs(diffInDays)} days ago`
  } else if (diffInDays > 7 && diffInDays <= 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
  } else if (diffInDays < -7 && diffInDays >= -30) {
    const weeks = Math.floor(Math.abs(diffInDays) / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  } else if (diffInDays > 30) {
    const months = Math.floor(diffInDays / 30)
    return `In ${months} ${months === 1 ? 'month' : 'months'}`
  } else {
    const months = Math.floor(Math.abs(diffInDays) / 30)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  }
}

/**
 * Format a percentage
 *
 * @param value - The value to format as percentage (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string (e.g., "75%")
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a percentage from a raw number (e.g., 75 -> "75%")
 *
 * @param value - Raw percentage value (e.g., 75)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string (e.g., "75%")
 */
export function formatRawPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format a month and year as a human-readable string
 *
 * @param month - Month number (1-12)
 * @param year - Full year (e.g., 2025)
 * @returns Formatted month string (e.g., "October 2025")
 */
export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * Format a month as a short string
 *
 * @param month - Month number (1-12)
 * @returns Short month string (e.g., "Oct")
 */
export function formatMonth(month: number): string {
  const date = new Date(2024, month - 1, 1)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
  }).format(date)
}

/**
 * Format a number with thousand separators
 *
 * @param value - The number to format
 * @returns Formatted number string (e.g., "1,234")
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

/**
 * Get budget status color based on percentage used
 *
 * @param percentage - Percentage of budget used
 * @returns Color class name for Tailwind CSS
 */
export function getBudgetStatusColor(percentage: number): string {
  if (percentage >= 100) {
    return 'text-red-600 bg-red-50 border-red-200'
  } else if (percentage >= 80) {
    return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  } else {
    return 'text-green-600 bg-green-50 border-green-200'
  }
}

/**
 * Get budget status badge color based on percentage used
 *
 * @param percentage - Percentage of budget used
 * @returns Badge color classes for Tailwind CSS
 */
export function getBudgetStatusBadgeColor(percentage: number): string {
  if (percentage >= 100) {
    return 'bg-red-100 text-red-800 border-red-200'
  } else if (percentage >= 90) {
    return 'bg-orange-100 text-orange-800 border-orange-200'
  } else if (percentage >= 80) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  } else {
    return 'bg-green-100 text-green-800 border-green-200'
  }
}

/**
 * Get budget status label
 *
 * @param percentage - Percentage of budget used
 * @returns Status label string
 */
export function getBudgetStatusLabel(percentage: number): string {
  if (percentage >= 100) {
    return 'Over Budget'
  } else if (percentage >= 90) {
    return 'Alert'
  } else if (percentage >= 80) {
    return 'Warning'
  } else {
    return 'On Track'
  }
}

/**
 * Truncate text to a maximum length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Pluralize a word based on count
 *
 * @param count - The count to determine pluralization
 * @param singular - Singular form of the word
 * @param plural - Plural form of the word (optional, defaults to singular + 's')
 * @returns Pluralized word
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  return count === 1 ? singular : plural || `${singular}s`
}

/**
 * Format a time duration in milliseconds to human-readable format
 *
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted duration string (e.g., "2.5s", "1.2m")
 */
export function formatDuration(milliseconds: number): string {
  const seconds = milliseconds / 1000
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }
  const minutes = seconds / 60
  if (minutes < 60) {
    return `${minutes.toFixed(1)}m`
  }
  const hours = minutes / 60
  return `${hours.toFixed(1)}h`
}

/**
 * Get initials from a name
 *
 * @param name - Full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Capitalize first letter of a string
 *
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}
