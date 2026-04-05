local nk = require("nakama")
local M = {}

-- In-memory store of open match IDs
-- { classic = "match-id", timed = "match-id" }
local open_matches = {}

function M.find_or_create_match(ctx, logger, _, payload)
  local params = {}
  if payload and payload ~= "" then
    local ok, dec = pcall(nk.json_decode, payload)
    if ok and type(dec) == "table" then params = dec end
  end
  local timed = params.timed == true
  local key = timed and "timed" or "classic"

  -- Check if we have a stored open match
  local existing = open_matches[key]
  if existing then
    open_matches[key] = nil  -- clear it so no 3rd player tries to join
    nk.logger_info("Joining existing match: " .. existing)
    return nk.json_encode({ match_id = existing, created = false })
  end

  -- Create a new match and store it for the next player
  local match_id, err = nk.match_create("tictactoe", { timed = tostring(timed) })
  if err then error("Failed to create match: " .. tostring(err)) end

  open_matches[key] = match_id
  nk.logger_info("Created match, waiting for opponent: " .. match_id)
  return nk.json_encode({ match_id = match_id, created = true })
end

function M.create_private_match(ctx, logger, _, payload)
  local params = {}
  if payload and payload ~= "" then
    local ok, dec = pcall(nk.json_decode, payload)
    if ok and type(dec) == "table" then params = dec end
  end
  local timed = params.timed == true
  local match_id, err = nk.match_create("tictactoe", { timed = tostring(timed) })
  if err then error("Failed to create match: " .. tostring(err)) end
  return nk.json_encode({ match_id = match_id })
end

function M.join_match_by_id(ctx, logger, _, payload)
  local params = {}
  if payload and payload ~= "" then
    local ok, dec = pcall(nk.json_decode, payload)
    if ok and type(dec) == "table" then params = dec end
  end
  local match_id = params.match_id
  if not match_id or match_id == "" then
    error("match_id is required")
  end
  return nk.json_encode({ match_id = match_id, valid = true })
end

return M