
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";

export default function RoomsPage() {
  const router = useRouter();

  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const connection = getSocket();
    setSocket(connection);

    function onRoomsUpdate(data) {
      setRooms(data);
    }

    function onJoinError(message) {
      setError(message);
      setLoading(false);
    }

    function onJoinedRoom({ roomId, playerId }) {
      sessionStorage.setItem("roomId", roomId);
      sessionStorage.setItem("playerId", playerId);
      sessionStorage.setItem("playerName", name.trim());

      router.push("/game");
    }

    connection.on("rooms-update", onRoomsUpdate);
    connection.on("join-error", onJoinError);
    connection.on("joined-room", onJoinedRoom);

    if (!connection.connected) {
      connection.connect();
    }

    return () => {
      connection.off("rooms-update", onRoomsUpdate);
      connection.off("join-error", onJoinError);
      connection.off("joined-room", onJoinedRoom);
    };
  }, [router, name]);

  function joinRoom(roomId) {
    if (!socket || !name.trim()) {
      setError("Digite seu nome antes de entrar.");
      return;
    }

    setError("");
    setLoading(true);

    socket.emit("join-room", {
      roomId,
      name: name.trim(),
    });
  }

  return (
    <main className="min-h-screen bg-[#063D2B] text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl space-y-8">

        <header className="text-center">
          <h1 className="text-4xl font-black text-[#F5D547]">
            BRASIL CONTINENTAL
          </h1>

          <p className="mt-2 text-white/80">
            Escolha uma sala e prepare-se para jogar!
          </p>
        </header>

        <section className="bg-white rounded-2xl p-6 text-[#063D2B] space-y-4">
          <label className="block font-bold">
            Nome do jogador
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="Digite seu nome"
            className="w-full p-3 rounded-lg border-2 border-gray-200 outline-none focus:border-[#087C45]"
          />

          <p className="text-sm text-gray-500">
            Você escolherá sua cor depois de entrar na sala.
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          {["sala1", "sala2"].map((roomId) => {
            const room = rooms.find((r) => r.id === roomId);

            const count = room?.players ?? 0;
            const locked = room?.locked ?? false;
            const full = count >= 6;
            const unavailable = locked || full;

            return (
              <div
                key={roomId}
                className="bg-white text-[#063D2B] rounded-2xl p-6 space-y-4"
              >
                <h2 className="text-2xl font-black">
                  {roomId === "sala1" ? "Sala 1" : "Sala 2"}
                </h2>

                <p className="text-3xl font-black">
                  {count}/6
                </p>

                <p className="text-sm text-gray-600">
                  {locked
                    ? "Partida iniciada — sala bloqueada"
                    : full
                    ? "Sala lotada"
                    : "Disponível para entrada"}
                </p>

                <button
                  onClick={() => joinRoom(roomId)}
                  disabled={unavailable || loading || !name.trim()}
                  className="w-full rounded-xl p-3 font-bold bg-[#F5D547] text-[#063D2B] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {locked ? "Sala bloqueada" : "Entrar na sala"}
                </button>
              </div>
            );
          })}
        </section>

        {error && (
          <p className="text-center text-yellow-300 font-bold">
            {error}
          </p>
        )}

      </div>
    </main>
  );
}
