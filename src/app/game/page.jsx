
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getSocket } from "@/lib/socket";

import Board from "@/components/Board";
import Dado from "@/components/Dado";
import Questionario from "@/components/Questionario";
import WinModal from "@/components/WinModal";

const boardData = [
  { casa: "Início", area: "inicio" },

  ...Array.from({ length: 6 }, (_, i) => ({
    casa: `Casa ${i + 1}`,
    area: "sul",
    nivel: "facil",
  })),

  ...Array.from({ length: 6 }, (_, i) => ({
    casa: `Casa ${i + 7}`,
    area: "sudeste",
    nivel: "medio",
  })),

  ...Array.from({ length: 6 }, (_, i) => ({
    casa: `Casa ${i + 13}`,
    area: "centro-oeste",
    nivel: "dificil",
  })),

  { casa: "Fim", area: "fim" },
];

export default function Game() {
  const router = useRouter();

  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [question, setQuestion] = useState(null);
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState("");
  const [diceResult, setDiceResult] = useState(null);
  const [isMyQuestion, setIsMyQuestion] = useState(false);

  const [myId, setMyId] = useState(null);
  const [myName, setMyName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState("");
  const [diceRolling, setDiceRolling] = useState(false);
  const [movement, setMovement] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState(null);



  const isMyTurn =
    room?.currentPlayerId === myId;


  useEffect(() => {
    const roomId = sessionStorage.getItem("roomId");
    const playerId = sessionStorage.getItem("playerId");
    const playerName = sessionStorage.getItem("playerName");

    if (!roomId || !playerId || !playerName) {
      router.replace("/rooms");
      return;
    }

    // Primeiro inicializamos a conexão.
    const connection = getSocket();

    setMyId(playerId);
    setMyName(playerName);
    setSocket(connection);

    function onConnect() {
      // Solicita o estado da sala após conectar.
      connection.emit("get-room-state", { roomId });
    }

    function onState(state) {
      setRoom(state);
      setLoading(false);
    }

    function onQuestion(data) {
      setQuestion(data);
      setIsMyQuestion(true);
      setMessage("");
    }

    function onRollAnimation(data) {
      setDiceResult(data.dice);
      setDiceRolling(true);
      setMessage(
        data.playerId === playerId
          ? "Você está rolando o dado!"
          : `${room?.players.find((p) => p.id === data.playerId)?.name || "Outro jogador"} está rolando o dado!`
      );

      setMovement(null);
    }

    function onRollResult(data) {
      setDiceResult(data.dice);
      setDiceRolling(false);

      setMovement({
        playerId: data.playerId,
        from: data.from,
        to: data.position,
        id: Date.now(),
      });

      setMessage(`Resultado do dado: ${data.dice}`);
    }

    const onAnswerResult = (data) => {
      const currentPlayerId = sessionStorage.getItem("playerId");

      if (!data || data.playerId !== currentPlayerId) return;

      setAnswerFeedback(data);

      setMessage(
        data.correct
          ? "Resposta correta! Você acertou."
          : "Resposta incorreta! Você perdeu a posição."
      );

      setTimeout(() => {
        setQuestion(null);
        setIsMyQuestion(false);
        setAnswerFeedback(null);
        setMessage("");
      }, 1000);
    };
    function onWin(data) {
      setWinner(data);
    }

    function onError(text) {
      setMessage(text);
    }

    function onJoinError(text) {
      setMessage(text);
      setLoading(false);
      router.replace("/rooms");
    }

    function onRoomReset() {
      sessionStorage.removeItem("roomId");
      sessionStorage.removeItem("playerId");
      sessionStorage.removeItem("playerName");
      sessionStorage.removeItem("playerColor");

      setRoom(null);
      setWinner(null);
      setQuestion(null);

      router.replace("/rooms");
    }

    connection.on("connect", onConnect);
    connection.on("game-state", onState);
    connection.on("your-question", onQuestion);
    connection.on("roll-animation", onRollAnimation);
    connection.on("roll-result", onRollResult);
    connection.on("answer-result", onAnswerResult);
    connection.on("game-won", onWin);
    connection.on("game-error", onError);
    connection.on("join-error", onJoinError);
    connection.on("room-reset", onRoomReset);

    if (!connection.connected) {
      connection.connect();
    } else {
      connection.emit("get-room-state", { roomId });
    }

    function handlePageHide() {
      connection.disconnect();
    }

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      connection.off("connect", onConnect);
      connection.off("game-state", onState);
      connection.off("your-question", onQuestion);
      connection.off("roll-animation", onRollAnimation);
      connection.off("roll-result", onRollResult);
      connection.off("answer-result", onAnswerResult);
      connection.off("game-won", onWin);
      connection.off("game-error", onError);
      connection.off("join-error", onJoinError);
    };
  }, [router]);

  function selectColor(color) {
    setSelectedColor(color);
    socket?.emit("select-color", color);
    sessionStorage.setItem("playerColor", color);
  }

  function markReady() {
    socket?.emit("toggle-ready");
  }

  function rollDice() {
    if (!isMyTurn || question || !room || room.status !== "playing") {
      return;
    }

    setMessage("Rolando o dado...");
    socket.emit("roll-dice");
  }

  function answerQuestion(answer) {
    if (!isMyQuestion || !socket || answerFeedback) return;

    socket.emit("answer-question", answer);
  }

  function restartGame() {
    socket?.emit("restart-game");
    setWinner(null);
    setQuestion(null);
    setMessage("");
    setDiceResult(null);
  }

  function exitGame() {
    socket?.emit("leave-room");

    sessionStorage.removeItem("roomId");
    sessionStorage.removeItem("playerId");
    sessionStorage.removeItem("playerName");
    sessionStorage.removeItem("playerColor");

    router.replace("/rooms");
  }

  if (loading || !room) {
    return (
      <main className="min-h-screen bg-[#063D2B] text-white flex items-center justify-center">
        <p>Conectando à partida...</p>
      </main>
    );
  }

  const currentPlayer = room.players.find(
    (player) => player.id === room.currentPlayerId
  );

  const myPlayer = room.players.find((p) => p.id === myId);
  const myColor = myPlayer?.color || "";

  return (
    <main className="h-dvh w-full overflow-hidden flex flex-col bg-gradient-to-br from-[#063D2B] to-[#087C45] text-white">

      <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-8 border-b border-white/10">
        <h1 className="font-black text-xl md:text-2xl text-[#F5D547]">
          BRASIL CONTINENTAL
        </h1>

        <span className="font-bold text-sm">
          {room.id === "sala1" ? "Sala 1" : "Sala 2"}
        </span>
      </header>

      {room.status === "waiting" && (
        <section className="flex-1 min-h-0 overflow-y-auto p-4 flex items-center justify-center">
          <div className="bg-white text-[#063D2B] rounded-2xl p-6 w-full max-w-xl space-y-5">

            <h2 className="text-2xl font-black text-center">
              Sala de espera
            </h2>

            <p className="text-center text-gray-600">
              {room.players.length}/6 jogadores
            </p>

            <div className="space-y-3">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center p-3 bg-gray-100 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />

                    <span className="font-bold">
                      {player.name}
                      {player.id === myId && " (Você)"}
                    </span>
                  </div>

                  <span
                    className={`text-sm font-bold ${player.ready ? "text-green-700" : "text-orange-600"
                      }`}
                  >
                    {player.ready ? "Pronto" : "Aguardando"}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="font-black text-center">
                Escolha sua cor
              </h3>

              <div className="flex flex-wrap justify-center gap-3">
                {[
                  "#087C45",
                  "#F5D547",
                  "#2879B9",
                  "#E66B35",
                  "#9B59B6",
                  "#E84393",
                ].map((color) => {
                  const used = room.players.some(
                    (p) => p.id !== myId && p.color === color
                  );

                  return (
                    <button
                      key={color}
                      disabled={used || myPlayer?.ready}
                      onClick={() => selectColor(color)}
                      style={{ backgroundColor: color }}
                      className={`
            h-11 w-11 rounded-full border-4 transition
            ${myColor === color
                          ? "border-[#063D2B] scale-110"
                          : "border-gray-300"}
            ${used ? "opacity-20 cursor-not-allowed" : ""}
          `}
                      aria-label={`Escolher cor ${color}`}
                    />
                  );
                })}
              </div>

              <p className="text-sm text-center text-gray-500">
                {myColor
                  ? "Cor selecionada!"
                  : "Escolha uma cor disponível para continuar."}
              </p>
            </div>

            <button
              disabled={!myColor}
              onClick={markReady}
              className="w-full p-4 rounded-xl font-black bg-[#F5D547] hover:brightness-95"
            >
              {room.players.find((p) => p.id === myId)?.ready
                ? "Cancelar prontidão"
                : "Estou pronto!"}
            </button>

            <p className="text-center text-sm text-gray-500">
              A partida começa automaticamente quando houver pelo menos
              dois jogadores e todos estiverem prontos.
            </p>
          </div>
        </section>
      )}

      {room.status !== "waiting" && (
        <section className="flex-1 min-h-0 flex flex-col md:flex-row gap-2 p-2 overflow-hidden">

          <div className="flex-1 min-w-0 min-h-0">
            <Board
              players={room.players}
              boardData={boardData}
            />
          </div>

          <aside className="w-full md:w-64 shrink-0 bg-white/10 rounded-xl p-3 flex flex-col gap-3 overflow-y-auto">

            <div>
              <h2 className="font-black text-[#F5D547]">
                Jogadores
              </h2>

              <div className="space-y-2 mt-2">
                {room.players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-2 rounded-lg flex items-center justify-between ${player.id === room.currentPlayerId
                      ? "bg-[#F5D547] text-[#063D2B]"
                      : "bg-white/10"
                      }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: player.color }}
                      />

                      <span className="font-bold truncate text-sm">
                        {player.name}
                        {player.id === myId ? " (Você)" : ""}
                      </span>
                    </div>

                    <span className="text-xs font-bold">
                      Casa {player.pos + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/20 pt-3">
              <p className="text-sm font-bold">
                Vez de:
              </p>

              <p className="text-[#F5D547] font-black">
                {currentPlayer?.name || "Aguardando"}
              </p>
            </div>

            {room.status === "playing" && (
              <div className="flex flex-col items-center gap-3">
                <Dado
                  value={diceResult || 1}
                  rolling={diceRolling}
                  disabled={!isMyTurn || !!question || diceRolling || !!room.animation}
                  onRoll={rollDice}
                />

                <p className="text-sm font-bold text-center">
                  {diceRolling
                    ? "O dado está girando..."
                    : isMyTurn
                      ? "É sua vez! Clique no dado."
                      : "Aguardando sua vez..."}
                </p>
              </div>
            )
            }
            {message && (
              <p className="text-center text-sm text-[#F5D547]">
                {message}
              </p>
            )}
            <button
              onClick={exitGame}
              className="w-full rounded-xl p-3 bg-red-500 text-white font-bold hover:bg-red-600"
            >
              Sair da sala
            </button>
          </aside>
        </section>
      )}

      {question && isMyQuestion && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xl">
            <Questionario
              question={question}
              onAnswer={answerQuestion}
              feedback={answerFeedback}
            />
          </div>
        </div>
      )}

      {winner && (
        <WinModal
          winner={winner}
          onRestart={restartGame}
        />
      )}

    </main>
  );
}
