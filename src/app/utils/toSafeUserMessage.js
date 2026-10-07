const GENERIC_FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

// Only messages explicitly allow-listed here are shown to the user as-is.
// Everything else (status codes, stack traces, raw server text, network
// errors) is replaced with a safe, generic message so no technical detail
// or sensitive information is ever surfaced in the UI.
const SAFE_MESSAGES = new Set([
  'Invalid username or password.',
  'Enter your username and password to continue.',
  'Navigation menu is unavailable right now.',
])

export function toSafeUserMessage(error) {
  const message = typeof error === 'string' ? error : error?.message

  if (message && SAFE_MESSAGES.has(message)) {
    return message
  }

  return GENERIC_FALLBACK_MESSAGE
}
