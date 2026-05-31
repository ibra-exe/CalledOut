import type { QuestionHistoryEntry, PlayerTitle } from '../types'

interface PlayerStats {
  totalVotes: number
  votesPerQuestion: number[]
  categoryVotes: Record<string, number>
  questionsWon: number
  questionsInTop2: number
  questionsWithVotes: number
}

function buildStats(
  playerIds: string[],
  history: Record<string, QuestionHistoryEntry>
): Record<string, PlayerStats> {
  const stats: Record<string, PlayerStats> = {}
  for (const pid of playerIds) {
    stats[pid] = {
      totalVotes: 0,
      votesPerQuestion: [],
      categoryVotes: {},
      questionsWon: 0,
      questionsInTop2: 0,
      questionsWithVotes: 0,
    }
  }

  for (const entry of Object.values(history)) {
    const { votes = {}, category } = entry
    const max = Math.max(0, ...Object.values(votes))
    const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1])
    const top2Ids = sorted.slice(0, 2).map(([id]) => id)

    for (const pid of playerIds) {
      const v = votes[pid] ?? 0
      stats[pid].totalVotes += v
      stats[pid].votesPerQuestion.push(v)
      stats[pid].categoryVotes[category] = (stats[pid].categoryVotes[category] ?? 0) + v
      if (v > 0) stats[pid].questionsWithVotes++
      if (v === max && max > 0) stats[pid].questionsWon++
      if (top2Ids.includes(pid) && v > 0) stats[pid].questionsInTop2++
    }
  }

  return stats
}

export function assignTitles(
  playerIds: string[],
  history: Record<string, QuestionHistoryEntry>
): PlayerTitle[] {
  const stats = buildStats(playerIds, history)
  const totalQuestions = Object.keys(history).length
  const assigned = new Set<string>()
  const titles: PlayerTitle[] = []

  const candidates = [...playerIds]

  const pick = (
    scorer: (pid: string) => number,
    title: string,
    subtitle: string,
    filter?: (pid: string) => boolean
  ) => {
    const pool = candidates.filter(p => !assigned.has(p) && (filter ? filter(p) : true))
    if (pool.length === 0) return
    pool.sort((a, b) => scorer(b) - scorer(a))
    const winner = pool[0]
    if (scorer(winner) <= 0) return // don't award a title for a zero score
    assigned.add(winner)
    titles.push({ playerId: winner, title, subtitle })
  }

  // Main Character — most total votes
  pick(p => stats[p].totalVotes, 'The Main Character', 'Most voted overall')

  // The Sleeper — low votes overall but won at least one question
  pick(
    p => stats[p].questionsWon,
    'The Sleeper',
    'Dark horse — low votes, but clutch wins',
    p => stats[p].questionsWon >= 1 && stats[p].totalVotes < (stats[playerIds[0]]?.totalVotes ?? 0) * 0.5
  )

  // Certified Chaotic — most votes in spicy
  pick(p => stats[p].categoryVotes['spicy'] ?? 0, 'Certified Chaotic', 'Reigning champion of spicy questions')

  // The Hopeless Romantic — most votes in romantic
  pick(p => stats[p].categoryVotes['romantic'] ?? 0, 'The Hopeless Romantic', 'Voted most romantic, every time')

  // Class Clown — most votes in funny
  pick(p => stats[p].categoryVotes['funny'] ?? 0, 'Class Clown', 'The group\'s comedian')

  // The Philosopher — most votes in deep
  pick(p => stats[p].categoryVotes['deep'] ?? 0, 'The Philosopher', 'Always the most thoughtful')

  // Predictably You — most consistent (voted in most questions)
  pick(p => stats[p].questionsWithVotes, 'Predictably You', `Got votes in ${stats[playerIds.find(p => !assigned.has(p)) ?? playerIds[0]]?.questionsWithVotes ?? 0} of ${totalQuestions} questions`)

  // The Wildcard — always in top 2 but never unanimous
  pick(
    p => stats[p].questionsInTop2,
    'The Wildcard',
    'Always controversial, never a consensus',
    p => stats[p].questionsInTop2 > 0 && stats[p].questionsWon < stats[p].questionsInTop2
  )

  // Remaining players get a fallback title based on whether they received any votes
  for (const pid of candidates) {
    if (!assigned.has(pid)) {
      const neverVoted = stats[pid].totalVotes === 0
      titles.push({
        playerId: pid,
        title: neverVoted ? 'The Forsaken One' : 'The Mysterious One',
        subtitle: neverVoted
          ? 'Not a single vote. Not even from themselves.'
          : 'Quietly watching, rarely judged',
      })
      assigned.add(pid)
    }
  }

  return titles
}
