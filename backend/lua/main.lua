local nk = require("nakama")
require("tictactoe")
local matchmaker  = require("matchmaker")
local leaderboard = require("leaderboard")

nk.register_rpc(matchmaker.find_or_create_match, "find_or_create_match")
nk.register_rpc(matchmaker.create_private_match,  "create_private_match")
nk.register_rpc(matchmaker.join_match_by_id,      "join_match_by_id")
nk.register_rpc(leaderboard.get_leaderboard,      "get_leaderboard")
nk.register_rpc(leaderboard.get_player_stats,     "get_player_stats")

print("LILA TicTacToe loaded OK")