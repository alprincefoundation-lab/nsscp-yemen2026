// JWT Middleware — resolves authenticated officer identity from the persistent session store.
import { getSession } from '@/lib/auth/session-manager'

export async function requireOfficerId(request: Request): Promise<string> {
  // Resolve the persistent session token from Authorization header.
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const session = await getSession(token)
    if (session?.userId) return session.userId
  }
  throw new Error('Authentication required')
}
