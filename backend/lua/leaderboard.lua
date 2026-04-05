local nk = require("nakama")
local LEADERBOARD_ID = "global_wins"
local M = {}

-- Create leaderboard if it doesn't exist
pcall(function()
  nk.leaderboard_create(LEADERBOARD_ID, false, "desc", "incr", nil, {})
end)

function M.get_leaderboard(ctx, logger, _, payload)
  local entries = {}
  local ok, records = pcall(function()
    local r, _, _, _, _ = nk.leaderboard_records_list(LEADERBOARD_ID, nil, 20, nil, 0)
    return r
  end)
  if ok and records then
    for rank, record in ipairs(records) do
      table.insert(entries, {
        rank        = rank,
        user_id     = record.owner_id,
        username    = record.username,
        wins        = record.score,
        update_time = record.update_time,
      })
    end
  end
  if #entries == 0 then return '{"leaderboard":[]}' end
  return nk.json_encode({ leaderboard = entries })
end

function M.get_player_stats(ctx, logger, _, payload)
  local user_id = ctx.user_id
  local stats = { wins=0, losses=0, draws=0, win_streak=0, best_streak=0 }
  pcall(function()
    local res = nk.storage_read({
      { collection="player_stats", key="stats", user_id=user_id }
    })
    if res and #res > 0 then
      stats = type(res[1].value) == "table" and res[1].value or nk.json_decode(res[1].value)
    end
  end)
  local total = stats.wins + stats.losses + stats.draws
  local win_rate = (total > 0) and math.floor((stats.wins / total) * 100) or 0
  return nk.json_encode({
    user_id  = user_id,
    stats    = stats,
    total    = total,
    win_rate = win_rate,
  })
end

return M