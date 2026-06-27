import type { QuestionHistoryEntry, PlayerTitle } from '../types'

interface PlayerStats {
  totalVotes: number
  votesPerQuestion: number[]
  categoryVotes: Record<string, number>
  questionsWon: number
  questionsInTop2: number
  questionsWithVotes: number
  selfVotes: number
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
      selfVotes: 0,
    }
  }

  for (const entry of Object.values(history)) {
    const { votes = {}, selfVotes = {}, category } = entry
    const max = Math.max(0, ...Object.values(votes))
    const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1])
    const top2Ids = sorted.slice(0, 2).map(([id]) => id)

    for (const pid of playerIds) {
      const v = votes[pid] ?? 0
      stats[pid].totalVotes += v
      stats[pid].votesPerQuestion.push(v)
      stats[pid].categoryVotes[category] = (stats[pid].categoryVotes[category] ?? 0) + v
      stats[pid].selfVotes += selfVotes[pid] ?? 0
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
  // Stable id — maps to i18n keys `title_<id>` and `sub_<id>`.
  id: string
  // Raw metric this title rewards (higher = stronger fit). 0 means "not applicable".
  score: (s: PlayerStats) => number
  // Optional gate — player must qualify to even be considered for this title.
  eligible?: (s: PlayerStats, ctx: TitleContext) => boolean
  // Numeric params injected into the localized subtitle template (e.g. {n}, {m}).
  params?: (s: PlayerStats, ctx: TitleContext) => Record<string, number>
}

// Each category maps to a flavorful title so no category's votes are ever wasted.
const TITLE_DEFS: TitleDef[] = [
  // ── General voting patterns ──
  {
    id: 'main_character',
    score: s => s.totalVotes,
    params: s => ({ n: s.totalVotes }),
  },
  {
    id: 'sleeper',
    score: s => s.questionsWon,
    eligible: (s, ctx) => s.questionsWon >= 1 && s.totalVotes < ctx.avgTotalVotes,
    params: s => ({ n: s.questionsWon }),
  },
  {
    id: 'wildcard',
    score: s => s.questionsInTop2,
    eligible: s => s.questionsInTop2 > 0 && s.questionsWon < s.questionsInTop2,
    params: s => ({ n: s.questionsInTop2 }),
  },
  {
    id: 'predictably',
    score: s => s.questionsWithVotes,
    eligible: (s, ctx) => ctx.totalQuestions > 0 && s.questionsWithVotes >= Math.ceil(ctx.totalQuestions / 2),
    params: (s, ctx) => ({ n: s.questionsWithVotes, m: ctx.totalQuestions }),
  },
  {
    id: 'their_own_fan',
    score: s => s.selfVotes,
    // Most of the votes they got were cast by themselves.
    eligible: s => s.selfVotes >= 1 && s.selfVotes * 2 > s.totalVotes,
    params: s => ({ n: s.selfVotes, m: s.totalVotes }),
  },
  // ── Category champions (one per category) ──
  { id: 'menace', score: s => s.categoryVotes['spicy'] ?? 0 },
  { id: 'class_clown', score: s => s.categoryVotes['funny'] ?? 0 },
  { id: 'philosopher', score: s => s.categoryVotes['deep'] ?? 0 },
  { id: 'chaotic', score: s => s.categoryVotes['chaotic'] ?? 0 },
  { id: 'romantic', score: s => s.categoryVotes['romantic'] ?? 0 },
  { id: 'legend', score: s => s.categoryVotes['achievements'] ?? 0 },
  { id: 'cringe', score: s => s.categoryVotes['awkward'] ?? 0 },
  { id: 'daredevil', score: s => s.categoryVotes['bold'] ?? 0 },
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
    if (assignedPlayers.has(c.pid) || usedTitles.has(c.def.id)) continue
    assignedPlayers.add(c.pid)
    usedTitles.add(c.def.id)
    titles.push({ playerId: c.pid, titleId: c.def.id, params: c.def.params?.(stats[c.pid], ctx) })
  }

  // Anyone left over gets a fallback based on whether they were voted at all.
  for (const pid of playerIds) {
    if (assignedPlayers.has(pid)) continue
    const neverVoted = stats[pid].totalVotes === 0
    titles.push({
      playerId: pid,
      titleId: neverVoted ? 'forgotten' : 'mysterious',
    })
    assignedPlayers.add(pid)
  }

  return titles
}
