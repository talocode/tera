// Admin utilities
// Helper functions for admin authentication and authorization

const ADMIN_EMAILS = ['abdulmuizproject@gmail.com', 'mhistermuiz@gmail.com']

export function isAdminUser(email: string | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export function checkAdminAccess(email: string | undefined): { allowed: boolean; message?: string } {
  if (!email) {
    return { allowed: false, message: 'User not found' }
  }

  if (!isAdminUser(email)) {
    return { allowed: false, message: 'You do not have admin access' }
  }

  return { allowed: true }
}

export const ADMIN_EMAILS_LIST = ADMIN_EMAILS
