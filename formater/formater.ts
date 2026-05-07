export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatTimeRemaining(expiresAt: string | Date): string {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()
  
  if (diffMs <= 0) return "Expired"
  
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} left`
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} left`
  }
  return `${diffMins} min${diffMins !== 1 ? "s" : ""} left`
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}