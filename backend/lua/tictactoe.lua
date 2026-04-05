-- tictactoe.lua - Server-authoritative Tic-Tac-Toe (Nakama 3.x Lua API)
local nk = require("nakama")

local TICK_RATE     = 5
local MAX_EMPTY_SEC = 30
local TURN_TIMEOUT  = 30
local M = {}
local WINNING_LINES = {
  {1,2,3},{4,5,6},{7,8,9},
  {1,4,7},{2,5,8},{3,6,9},
  {1,5,9},{3,5,7}
}

local OP = {
  GAME_STATE=1, MOVE_REJECT=2, GAME_OVER=3,
  PLAYER_JOIN=4, PLAYER_LEAVE=5, TIMER_UPDATE=6, WAITING=7,
  MAKE_MOVE=101, REMATCH=102, FORFEIT=103,
}

local function count(t)
  if not t then return 0 end
  local n = 0
  for _ in ipairs(t) do n = n + 1 end
  return n
end

local function check_winner(board)
  for _, line in ipairs(WINNING_LINES) do
    local a, b, c = line[1], line[2], line[3]
    if board[a] ~= "" and board[a] == board[b] and board[b] == board[c] then
      return board[a], line
    end
  end
  return nil, nil
end

local function is_draw(board)
  for _, cell in ipairs(board) do
    if cell == "" then return false end
  end
  return true
end

local function empty_board()
  return {"","","","","","","","",""}
end

local function bcast(dispatcher, op, data, presences)
  dispatcher.broadcast_message(op, nk.json_encode(data), presences)
end

local function state_payload(state)
  return {
    board        = state.board,
    current_turn = state.current_turn,
    players      = state.players,
    phase        = state.phase,
    move_number  = state.move_number,
    timed_mode   = state.timed_mode,
    turn_deadline = state.turn_deadline,
  }
end

pcall(function() nk.leaderboard_create("global_wins", false, "desc", "incr", nil, {}) end)

local function record_result(state, winner_symbol)
  for _, player in ipairs(state.players) do
    if winner_symbol ~= nil and player.symbol == winner_symbol then
      local ok, err = pcall(function()
        nk.leaderboard_record_write("global_wins", player.user_id, player.username, 1, 0, nil)
      end)
      if not ok then
        nk.logger_warn("leaderboard_record_write failed: " .. tostring(err))
      else
        nk.logger_info("leaderboard_record_write success for: " .. player.username)
      end
    end
    nk.logger_info("attempting stats write for: " .. player.username)
    local ok2, err2 = pcall(function()
      nk.logger_info("inside pcall for " .. player.username)
      nk.logger_info("calling storage_read for " .. tostring(player.user_id))
      local read_ok, res = pcall(nk.storage_read, { {collection="player_stats", key="stats", user_id=player.user_id} })
      nk.logger_info("storage_read ok: " .. tostring(read_ok))
      if not read_ok then res = nil end
      local stats = {wins=0, losses=0, draws=0, win_streak=0, best_streak=0}
      if res and #res > 0 and type(res[1].value) == "table" then stats = res[1].value elseif res and #res > 0 then local ok, v = pcall(nk.json_decode, res[1].value) if ok then stats = v end end
      if winner_symbol == nil then
        stats.draws = stats.draws + 1
        stats.win_streak = 0
      elseif player.symbol == winner_symbol then
        stats.wins = stats.wins + 1
        stats.win_streak = stats.win_streak + 1
        if stats.win_streak > stats.best_streak then stats.best_streak = stats.win_streak end
      else
        stats.losses = stats.losses + 1
        stats.win_streak = 0
      end
      nk.logger_info("calling storage_write for " .. tostring(player.user_id))
      local write_ok, write_err = pcall(nk.storage_write, { {
        collection="player_stats", key="stats", user_id=player.user_id,
        value=stats, permission_read=2, permission_write=0,
      } })
      nk.logger_info("storage_write result: " .. tostring(write_ok) .. " " .. tostring(write_err))
      nk.logger_info("storage_write ok: " .. tostring(write_ok) .. " err: " .. tostring(write_err))
    end)
  end
end

function M.match_init(context, dispatcher, params)
  local timed = params and (params["timed"] == true or params["timed"] == "true")
  local state = {
    board        = empty_board(),
    phase        = "waiting",
    players      = {},
    current_turn = "X",
    move_number  = 0,
    timed_mode   = timed,
    turn_deadline = 0,
    empty_ticks  = 0,
    rematch_votes = {},
  }
  nk.logger_info("RAW PARAMS: " .. nk.json_encode(params or {}))
  local label = nk.json_encode({open=true, timed_mode=timed, players=0})
  print("Match init | timed=" .. tostring(timed))
  return state, TICK_RATE, label
end

function M.match_join_attempt(context, dispatcher, tick, state, presence, metadata)
  
  if count(state.players) >= 2 then
    return state, false, "Match is full"
  end
  return state, true
end

function M.match_join(context, dispatcher, tick, state, presences)
  for _, presence in ipairs(presences) do
    local symbol = (count(state.players) == 0) and "X" or "O"
    table.insert(state.players, {
      presence = presence,
      symbol   = symbol,
      user_id  = presence.user_id,
      username = presence.username,
    })
    bcast(dispatcher, OP.PLAYER_JOIN,
      {user_id=presence.user_id, username=presence.username, symbol=symbol}, nil)
  end

  if count(state.players) == 2 then
    state.phase        = "playing"
    state.current_turn = "X"
    state.move_number  = 0
    state.board        = empty_board()
    if state.timed_mode then
      state.turn_deadline = nk.time() / 1000 + TURN_TIMEOUT
    end
    dispatcher.match_label_update(nk.json_encode({open=false, timed_mode=state.timed_mode, players=2}))
    bcast(dispatcher, OP.GAME_STATE, state_payload(state), nil)
    print("Game started!")
  else
    dispatcher.match_label_update(nk.json_encode({open=true, timed_mode=state.timed_mode, players=1}))
    bcast(dispatcher, OP.WAITING, {message="Waiting for opponent..."}, nil)
  end
  return state
end

function M.match_leave(context, dispatcher, tick, state, presences)
  for _, leaving in ipairs(presences) do
    bcast(dispatcher, OP.PLAYER_LEAVE, {user_id=leaving.user_id, username=leaving.username}, nil)
    if state.phase == "playing" then
      for _, player in ipairs(state.players) do
        if player.user_id ~= leaving.user_id then
          bcast(dispatcher, OP.GAME_OVER, {
            winner=player.symbol, winner_id=player.user_id,
            winner_name=player.username, reason="opponent_disconnected", board=state.board,
          }, nil)
          record_result(state, player.symbol)
          break
        end
      end
      state.phase = "game_over"
    end
    for i, player in ipairs(state.players) do
      if player.user_id == leaving.user_id then
        table.remove(state.players, i)
        break
      end
    end
  end
  dispatcher.match_label_update(nk.json_encode({open=(count(state.players)<2), players=count(state.players)}))
  return state
end

function M.match_loop(context, dispatcher, tick, state, messages)
  for _, msg in ipairs(messages) do
    local op     = msg.op_code
    local sender = msg.sender
    local data   = {}
    if msg.data and msg.data ~= "" then
      local ok, dec = pcall(nk.json_decode, msg.data)
      if ok then data = dec end
    end

    local actor = nil
    for _, p in ipairs(state.players) do
      if p.user_id == sender.user_id then actor = p; break end
    end
    if not actor then goto continue end

    if op == OP.MAKE_MOVE and state.phase == "playing" then
      local cell = tonumber(data.cell)
      if actor.symbol ~= state.current_turn then
        bcast(dispatcher, OP.MOVE_REJECT, {reason="not_your_turn", cell=cell}, {sender}); goto continue
      end
      if not cell or cell < 1 or cell > 9 then
        bcast(dispatcher, OP.MOVE_REJECT, {reason="invalid_cell", cell=cell}, {sender}); goto continue
      end
      if state.board[cell] ~= "" then
        bcast(dispatcher, OP.MOVE_REJECT, {reason="cell_occupied", cell=cell}, {sender}); goto continue
      end
      state.board[cell] = actor.symbol
      state.move_number = state.move_number + 1

      local winner, wline = check_winner(state.board)
      if winner then
        state.phase = "game_over"
        local wp = nil
        for _, p in ipairs(state.players) do
          if p.symbol == winner then wp = p end
        end
        bcast(dispatcher, OP.GAME_OVER, {
          winner=winner, winner_id=wp and wp.user_id or "",
          winner_name=wp and wp.username or "",
          winning_line=wline, reason="win", board=state.board,
        }, nil)
        record_result(state, winner)
        goto continue
      end
      if is_draw(state.board) then
        state.phase = "game_over"
        bcast(dispatcher, OP.GAME_OVER, {winner=nil, reason="draw", board=state.board}, nil)
        record_result(state, nil)
        goto continue
      end
      state.current_turn = (state.current_turn == "X") and "O" or "X"
      if state.timed_mode then
        state.turn_deadline = nk.time() / 1000 + TURN_TIMEOUT
      end
      bcast(dispatcher, OP.GAME_STATE, state_payload(state), nil)

    elseif op == OP.FORFEIT and state.phase == "playing" then
      state.phase = "game_over"
      local wp = nil
      for _, p in ipairs(state.players) do
        if p.user_id ~= sender.user_id then wp = p; break end
      end
      bcast(dispatcher, OP.GAME_OVER, {
        winner=wp and wp.symbol or nil,
        winner_id=wp and wp.user_id or "",
        winner_name=wp and wp.username or "",
        reason="forfeit", board=state.board,
      }, nil)
      if wp then record_result(state, wp.symbol) end

    elseif op == OP.REMATCH and state.phase == "game_over" then
      state.rematch_votes[sender.user_id] = true
      local votes = 0
      for _ in pairs(state.rematch_votes) do votes = votes + 1 end
      if votes >= 2 then
        state.board         = empty_board()
        state.phase         = "playing"
        state.move_number   = 0
        state.rematch_votes = {}
        for _, p in ipairs(state.players) do
          p.symbol = (p.symbol == "X") and "O" or "X"
        end
        state.current_turn = "X"
        if state.timed_mode then
          state.turn_deadline = nk.time() / 1000 + TURN_TIMEOUT
        end
        bcast(dispatcher, OP.GAME_STATE, state_payload(state), nil)
      end
    end
    ::continue::
  end

  -- Timer enforcement
  if state.phase == "playing" and state.timed_mode and state.turn_deadline > 0 then
    local now = nk.time() / 1000
    local remaining = state.turn_deadline - now
    if remaining <= 0 then
      state.phase = "game_over"
      local wp = nil
      for _, p in ipairs(state.players) do
        if p.symbol ~= state.current_turn then wp = p; break end
      end
      bcast(dispatcher, OP.GAME_OVER, {
        winner=wp and wp.symbol or nil,
        winner_id=wp and wp.user_id or "",
        winner_name=wp and wp.username or "",
        reason="timeout", board=state.board,
      }, nil)
      if wp then record_result(state, wp.symbol) end
    else
      bcast(dispatcher, OP.TIMER_UPDATE,
        {remaining=math.floor(remaining), current_turn=state.current_turn}, nil)
    end
  end

  -- Terminate empty match
  if count(state.players) == 0 then
    state.empty_ticks = state.empty_ticks + 1
    if state.empty_ticks > TICK_RATE * MAX_EMPTY_SEC then
      return nil
    end
  else
    state.empty_ticks = 0
  end
  return state
end

function M.match_terminate(context, dispatcher, tick, state, grace_seconds)
  bcast(dispatcher, OP.GAME_OVER, {reason="server_shutdown"}, nil)
  return state
end

function M.match_signal(context, dispatcher, tick, state, data)
  return state, ""
end
return M