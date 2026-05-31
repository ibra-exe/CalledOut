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

interface TitleContext {
  totalQuestions: number
  avgTotalVotes: number
}

interface TitleDef {
  title: string
  // Raw metric this title rewards (higher = stronger fit). 0 means "not applicable".
  score: (s: PlayerStats) => number
  // Optional gate — player must qualify to even be considered for this title.
  eligible?: (s: PlayerStats, ctx: TitleContext) => boolean
  // Subtitle can adapt to the winner's actual numbers.
  subtitle: (s: PlayerStats, ctx: TitleContext) => string
}

// Each category maps to a flavorful title so no category's votes are ever wasted.
const TITLE_DEFS: TitleDef[] = [
  // ── General voting patterns ──
  {
    title: 'The Main Character',
    score: s => s.totalVotes,
    subtitle: s => `Most voted overall — ${s.totalVotes} vote${s.totalVotes === 1 ? '' : 's'}`,
  },
  {
    title: 'The Sleeper',
    score: s => s.questionsWon,
    eligible: (s, ctx) => s.questionsWon >= 1 && s.totalVotes < ctx.avgTotalVotes,
    subtitle: s => `Quiet overall, but stole ${s.questionsWon} round${s.questionsWon === 1 ? '' : 's'} outright`,
  },
  {
    title: 'The Wildcard',
    score: s => s.questionsInTop2,
    eligible: s => s.questionsInTop2 > 0 && s.questionsWon < s.questionsInTop2,
    subtitle: s => `In the mix for ${s.questionsInTop2} round${s.questionsInTop2 === 1 ? '' : 's'}, rarely the clear pick`,
  },
  {
    title: 'Predictably You',
    score: s => s.questionsWithVotes,
    eligible: (s, ctx) => ctx.totalQuestions > 0 && s.questionsWithVotes >= Math.ceil(ctx.totalQuestions / 2),
    subtitle: (s, ctx) => `Called out in ${s.questionsWithVotes} of ${ctx.totalQuestions} rounds`,
  },
  // ── Category champions (one per category) ──
  {
    title: 'The Menace',
    score: s => s.categoryVotes['spicy'] ?? 0,
    subtitle: () => 'Trouble seems to follow you everywhere',
  },
  {
    title: 'Class Clown',
    score: s => s.categoryVotes['funny'] ?? 0,
    subtitle: () => "The group's certified comedian",
  },
  {
    title: 'The Philosopher',
    score: s => s.categoryVotes['deep'] ?? 0,
    subtitle: () => 'The one everyone calls deep',
  },
  {
    title: 'Certified Chaotic',
    score: s => s.categoryVotes['chaotic'] ?? 0,
    subtitle: () => 'Reigning champion of pure chaos',
  },
  {
    title: 'The Hopeless Romantic',
    score: s => s.categoryVotes['romantic'] ?? 0,
    subtitle: () => 'Your name came up every time love did',
  },
  {
    title: 'The Legend',
    score: s => s.categoryVotes['achievements'] ?? 0,
    subtitle: () => 'Built different — the group MVP',
  },
  {
    title: 'Captain Cringe',
    score: s => s.categoryVotes['awkward'] ?? 0,
    subtitle: () => 'Master of the unforgettable awkward moment',
  },
  {
    title: 'The Daredevil',
    score: s => s.categoryVotes['bold'] ?? 0,
    subtitle: () => 'No dare too wild, no line uncrossed',
  },
]

interface Candidate {
  pid: string
  def: TitleDef
  norm: number // 0..1, how dominantly this player leads the metric
  raw: number
}

export function assignTitles(
  playerIds: string[],
  history: Record<string, QuestionHistoryEntry>
): PlayerTitle[] {
  const stats = buildStats(playerIds, history)
  const totalQuestions = Object.keys(history).length
  const totalVotesSum = playerIds.reduce((acc, p) => acc + stats[p].totalVotes, 0)
  const ctx: TitleContext = {
    totalQuestions,
    avgTotalVotes: playerIds.length > 0 ? totalVotesSum / playerIds.length : 0,
  }

  // Build every viable (player, title) pairing, normalized so titles are comparable.
  const candidates: Candidate[] = []
  for (const def of TITLE_DEFS) {
    const scores = playerIds.map(pid => ({
      pid,
      raw: def.eligible && !def.eligible(stats[pid], ctx) ? 0 : def.score(stats[pid]),
    }))
    const max = Math.max(0, ...scores.map(s => s.raw))
    if (max <= 0) continue // nobody qualifies for this title
    for (const { pid, raw } of scores) {
      if (raw <= 0) continue // a zero score never earns a title
      candidates.push({ pid, def, norm: raw / max, raw })
    }
  }

  // Greedy best-fit: lock in the strongest player↔title match first, then the next.
  // Tiebreak by raw magnitude so a clear leader beats a marginal one.
  candidates.sort((a, b) => (b.norm - a.norm) || (b.raw - a.raw))

  const assignedPlayers = new Set<string>()
  const usedTitles = new Set<string>()
  const titles: PlayerTitle[] = []

  for (const c of candidates) {
    if (assignedPlayers.has(c.pid) || usedTitles.has(c.def.title)) continue
    assignedPlayers.add(c.pid)
    usedTitles.add(c.def.title)
    titles.push({ playerId: c.pid, title: c.def.title, subtitle: c.def.subtitle(stats[c.pid], ctx) })
  }

  // Anyone left over gets a fallback based on whether they were voted at all.
  for (const pid of playerIds) {
    if (assignedPlayers.has(pid)) continue
    const neverVoted = stats[pid].totalVotes === 0
    titles.push({
      playerId: pid,
      title: neverVoted ? 'The Forsaken One' : 'The Mysterious One',
      subtitle: neverVoted
        ? 'Not a single vote. Not even from themselves.'
        : 'Flew under the radar all game',
    })
    assignedPlayers.add(pid)
  }

  return titles
}
