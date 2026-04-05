// components/LeaderboardPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { rpc } from '@/lib/nakama'
import { useStore } from '@/lib/store'

export default function LeaderboardPage() {
  const navigate  = useNavigate()
  const { username } = useStore()
  const [board,   setBoard]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [lb, ps] = await Promise.all([
          rpc('get_leaderboard', {}),
          rpc('get_player_stats', {}),
        ])
        console.log('lb:', lb)
        setBoard(Array.isArray(lb.leaderboard) ? lb.leaderboard : [])
        setStats(ps)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button onClick={() => navigate('/')} className="btn-ghost">← Back</button>
        <span className="font-display text-2xl text-neon tracking-wider">Leaderboard</span>
        <div className="w-16" />
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-6">
        {/* My stats card */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel p-5"
          >
            <p className="text-xs font-mono text-muted uppercase tracking-widest mb-3">Your Stats</p>
            <p className="font-display text-xl text-white mb-3">{username}</p>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: 'Wins',   value: stats.stats?.wins   || 0, color: 'text-neon'  },
                { label: 'Losses', value: stats.stats?.losses || 0, color: 'text-coral' },
                { label: 'Draws',  value: stats.stats?.draws  || 0, color: 'text-gold'  },
                { label: 'Win %',  value: `${stats.win_rate || 0}%`, color: 'text-white' },
              ].map(s => (
                <div key={s.label} className="bg-dim rounded-xl p-3">
                  <p className={`font-display text-2xl ${s.color}`}>{s.value}</p>
                  <p className="text-muted text-xs font-mono mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {stats.stats?.win_streak > 1 && (
              <p className="text-gold text-sm font-mono mt-3 text-center animate-pulse">
                🔥 {stats.stats.win_streak}-game win streak!
              </p>
            )}
          </motion.div>
        )}

        {/* Global leaderboard */}
        <div className="panel overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-mono text-muted uppercase tracking-widest">Global Rankings</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted font-mono text-sm">
              Loading…
            </div>
          ) : board.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted font-mono text-sm">
              No matches played yet. Be the first!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {board.map((entry, i) => {
                const isMe = entry.username === username
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-4 px-5 py-4 ${isMe ? 'bg-neon/5' : ''}`}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center">
                      {medal
                        ? <span className="text-xl">{medal}</span>
                        : <span className="text-muted font-mono text-sm">#{entry.rank}</span>
                      }
                    </div>

                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                      ${isMe ? 'bg-neon/20 text-neon border border-neon/40' : 'bg-border text-white'}`}>
                      {entry.username.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMe ? 'text-neon' : 'text-white'}`}>
                        {entry.username}
                        {isMe && <span className="text-neon/60 text-xs ml-1">(you)</span>}
                      </p>
                    </div>

                    {/* Wins */}
                    <div className="text-right">
                      <p className="font-display text-xl text-white">{entry.wins}</p>
                      <p className="text-muted text-xs font-mono">wins</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
