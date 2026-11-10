// Simple hash function for security answers
// Using SHA-256 via Web Crypto API

export async function hashString(input: string): Promise<string> {
  if (!input) return ''
  
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

// For server-side compatibility (Node.js environment)
export async function hashStringNode(input: string): Promise<string> {
  if (typeof window !== 'undefined') {
    return hashString(input)
  }
  
  // Fallback for server-side - would need crypto module
  // For now, return the input as-is (should be handled by server-side API)
  return input
}
