export function tallyVotes(votes: Record<string, string>): Record<string, number> {
  const tally: Record<string, number> = {}
  for (const votedFor of Object.values(votes)) {
    tally[votedFor] = (tally[votedFor] ?? 0) + 1
  }
  return tally
}

// Count which players voted for themselves (one self-vote per player per question)
export function tallySelfVotes(votes: Record<string, string>): Record<string, number> {
  const self: Record<string, number> = {}
  for (const [voter, votedFor] of Object.entries(votes)) {
    if (voter === votedFor) self[voter] = (self[voter] ?? 0) + 1
  }
  return self
}

export function getWinners(tally: Record<string, number>): string[] {
  if (Object.keys(tally).length === 0) return []
  const max = Math.max(...Object.values(tally))
  return Object.entries(tally)
    .filter(([, count]) => count === max)
    .map(([id]) => id)
}
