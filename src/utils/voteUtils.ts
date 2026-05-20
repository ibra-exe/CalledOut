export function tallyVotes(votes: Record<string, string>): Record<string, number> {
  const tally: Record<string, number> = {}
  for (const votedFor of Object.values(votes)) {
    tally[votedFor] = (tally[votedFor] ?? 0) + 1
  }
  return tally
}

export function getWinners(tally: Record<string, number>): string[] {
  if (Object.keys(tally).length === 0) return []
  const max = Math.max(...Object.values(tally))
  return Object.entries(tally)
    .filter(([, count]) => count === max)
    .map(([id]) => id)
}
