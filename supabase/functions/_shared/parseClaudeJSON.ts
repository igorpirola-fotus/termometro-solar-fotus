export function parseClaudeJSON(rawText: string): unknown {
  try {
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(clean)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('JSON não encontrado na resposta do Claude')
    return JSON.parse(match[0])
  }
}
