const GENERIC_FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

// Only messages explicitly allow-listed here are shown to the user as-is.
// Everything else (status codes, stack traces, raw server text, network
// errors) is replaced with a safe, generic message so no technical detail
// or sensitive information is ever surfaced in the UI.
const SAFE_MESSAGES = new Set([
  'Invalid username or password.',
  'Enter your username and password to continue.',
  'Navigation menu is unavailable right now.',
  'You have been logged out successfully.',
  'Please correct the highlighted fields.',
  'User created successfully.',
  'Unable to create user right now.',
  'User deleted successfully.',
  'Unable to delete user right now.',
  'User is already exist in NxtGen',
  'Role created successfully.',
  'Unable to create role right now.',
  'User updated successfully.',
  'Unable to update user right now.',
  'Unable to load user details right now.',
  'Group created successfully.',
  'Unable to create group right now.',
  'Group updated successfully.',
  'Unable to update group right now.',
  'Unable to load group details right now.',
])

export function toSafeUserMessage(error) {
  const message = typeof error === 'string' ? error : error?.message

  if (message && SAFE_MESSAGES.has(message)) {
    return message
  }

  return GENERIC_FALLBACK_MESSAGE
}
