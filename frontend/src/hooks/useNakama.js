// hooks/useNakama.js — Socket lifecycle & message routing
import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getSocket, leaveMatch, sendMatchMessage, OP } from "@/lib/nakama";
import { useStore } from "@/lib/store";

export function useNakama(matchId) {
  const navigate = useNavigate();

  const applyGameState = useStore((s) => s.applyGameState);
  const setWaiting = useStore((s) => s.setWaiting);
  const setGameOver = useStore((s) => s.setGameOver);
  const setMySymbol = useStore((s) => s.setMySymbol);
  const addNotification = useStore((s) => s.addNotification);
  const resetMatch = useStore((s) => s.resetMatch);
  const setTimerRemaining = useStore((s) => s.setTimerRemaining);

  useEffect(() => {
    if (!matchId) return;
    const sock = getSocket();
    if (!sock) return;

    const onMatchData = (data) => {
      const op = data.op_code;
      let payload = {};

      try {
        const raw =
          typeof data.data === "string"
            ? data.data
            : new TextDecoder().decode(data.data);

        payload = JSON.parse(raw);

        // 🔥 DEBUG (IMPORTANT)
        console.log("🔥 MATCH DATA:", payload);
        console.log("🔥 TIMED MODE:", payload.timed_mode);
      } catch (e) {
        console.error("Parse error:", e);
      }

      switch (op) {
        case OP.GAME_STATE:
  console.log("GAME STATE RECEIVED:", payload)
  console.log("TIMED MODE (correct):", payload.timed_mode)

  applyGameState(payload)
  break

        case OP.WAITING:
          setWaiting();
          break;

        case OP.PLAYER_JOIN: {
          const myId = useStore.getState().session?.user_id;
          if (
            (data.sender && data.sender.user_id) === myId ||
            payload.user_id === myId
          ) {
            setMySymbol(payload.symbol);
          }
          addNotification(
            `${payload.username} joined as ${payload.symbol}`,
            "info",
          );
          break;
        }

        case OP.PLAYER_LEAVE:
          addNotification(`${payload.username} disconnected`, "warn");
          break;

        case OP.MOVE_REJECT:
          addNotification(`Invalid move: ${payload.reason}`, "error");
          break;

        case OP.GAME_OVER:
          setGameOver(payload);
          break;

        case OP.TIMER_UPDATE:
          setTimerRemaining(payload.remaining);
          break;

        default:
          break;
      }
    };

    const onMatchPresence = (presenceEvent) => {
      presenceEvent?.leaves?.forEach((p) => {
        addNotification(`${p.username} left the match`, "warn");
      });
    };

    // ✅ Correct assignment
    sock.onmatchdata = onMatchData;
    sock.onmatchpresence = onMatchPresence;

    // ✅ Proper cleanup (NO override bug)
    return () => {
      // sock.onmatchdata = null;
      // sock.onmatchpresence = null;
    };
  }, [
    matchId,
    applyGameState,
    setWaiting,
    setGameOver,
    setMySymbol,
    addNotification,
    setTimerRemaining,
  ]);

  const makeMove = useCallback(
    (cellIndex) => {
      if (!matchId) return;
      sendMatchMessage(matchId, OP.MAKE_MOVE, { cell: cellIndex + 1 });
    },
    [matchId],
  );

  const forfeit = useCallback(() => {
    if (!matchId) return;
    sendMatchMessage(matchId, OP.FORFEIT, {});
  }, [matchId]);

  const requestRematch = useCallback(() => {
    if (!matchId) return;
    sendMatchMessage(matchId, OP.REMATCH, {});
    addNotification("Rematch requested — waiting for opponent…", "info");
  }, [matchId, addNotification]);

  const exitMatch = useCallback(async () => {
    if (matchId) await leaveMatch(matchId);
    resetMatch();
    navigate("/");
  }, [matchId, navigate, resetMatch]);

  return { makeMove, forfeit, requestRematch, exitMatch };
}
