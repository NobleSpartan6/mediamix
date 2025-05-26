export const executeCommand = async (text: string): Promise<string> => {
  const res = await fetch('/api/ai/executeCommand', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('AI request failed')
  const data = await res.json()
  return typeof data.result === 'string' ? data.result : 'No response'
}
