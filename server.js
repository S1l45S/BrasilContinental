
const next = require("next");
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;
const FINISH_POSITION = 19;

// Banco de perguntas compartilhado com a API.
const questionsPath = path.join(
  __dirname,
  "src",
  "data",
  "questoes.json"
);

const PLAYER_COLORS = [
  "#087C45",
  "#F5D547",
  "#2879B9",
  "#E66B35",
  "#9B59B6",
  "#E84393",
];

function loadQuestions() {
  try {
    return JSON.parse(fs.readFileSync(questionsPath, "utf8"));
  } catch (error) {
    console.error("Erro ao carregar perguntas:", error);
    return { facil: [], medio: [], dificil: [] };
  }
}

const rooms = {
  sala1: createRoom("sala1"),
  sala2: createRoom("sala2"),
};

function createRoom(id) {
  return {
    id,
    players: [],
    status: "waiting",
    locked: false,
    turn: 0,
    pendingQuestion: null,
    winner: null,
    animation: null,
  };
}


function resetRoom(room) {
  room.players = [];
  room.status = "waiting";
  room.locked = false;
  room.turn = 0;
  room.pendingQuestion = null;
  room.winner = null;
  room.animation = null;
}


function publicRoom(room) {
  return {
    id: room.id,
    status: room.status,
    locked: room.locked,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      color: player.color,
      pos: player.pos,
      ready: player.ready,
    })),
    turn: room.turn,
    currentPlayerId:
      room.players[room.turn]?.id || null,
    winner: room.winner,
    pendingPlayerId:
      room.pendingQuestion?.playerId || null,
    animation: room.animation || null,
  };
}

function emitRoom(room) {
  io.to(room.id).emit(
    "game-state",
    publicRoom(room)
  );

  io.emit("rooms-update", getRoomsSummary());
}

function getRoomsSummary() {
  return Object.values(rooms).map((room) => ({
    id: room.id,
    players: room.players.length,
    maxPlayers: MAX_PLAYERS,
    status: room.status,
    locked: room.locked,
  }));
}

function getQuestionLevel(position) {
  if (position <= 6) return "facil";
  if (position <= 12) return "medio";
  return "dificil";
}

function getRandomQuestion(level) {
  const bank = loadQuestions();
  const questions = bank[level] || [];

  if (!questions.length) return null;

  const available = questions.filter(
    (question) => !question.usada
  );

  const selected =
    available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : questions[Math.floor(Math.random() * questions.length)];

  return {
    pergunta: selected.pergunta,
    opcoes: selected.opcoes,
    resposta: selected.resposta,
  };
}

function startGame(room) {
  if (
    room.status !== "waiting" ||
    room.players.length < MIN_PLAYERS ||
    !room.players.every((player) => player.ready)
  ) {
    return;
  }

  room.status = "playing";
  room.locked = true;
  room.turn = 0;
  room.winner = null;
  room.pendingQuestion = null;

  room.players.forEach((player) => {
    player.pos = 0;
  });

  emitRoom(room);
}

function nextTurn(room) {
  room.turn = (room.turn + 1) % room.players.length;
}


function removePlayerFromRoom(socket) {
  const roomId = socket.data.roomId;
  const room = rooms[roomId];

  if (!room) return;

  if (room.animation?.playerId === socket.id) {
    room.animation = null;
  }

  const currentPlayerId = room.players[room.turn]?.id;
  const removedIndex = room.players.findIndex(
    (player) => player.id === socket.id
  );

  if (removedIndex === -1) {
    socket.data.roomId = null;
    return;
  }

  const wasCurrentPlayer = currentPlayerId === socket.id;
  const hadPendingQuestion =
    room.pendingQuestion?.playerId === socket.id;

  // Remove o jogador.
  room.players.splice(removedIndex, 1);

  socket.leave(room.id);
  socket.data.roomId = null;

  // Se não sobrou ninguém, libera a sala.
  if (room.players.length === 0) {
    resetRoom(room);
    emitRoom(room);
    return;
  }

  if (room.status === "playing") {
    if (hadPendingQuestion) {
      room.pendingQuestion = null;
    }

    if (wasCurrentPlayer || hadPendingQuestion) {
      // O próximo jogador assume o turno.
      room.turn = removedIndex % room.players.length;
    } else {
      // Preserva o jogador que já estava com a vez.
      const newTurn = room.players.findIndex(
        (player) => player.id === currentPlayerId
      );

      room.turn = newTurn >= 0 ? newTurn : 0;
    }
  } else if (room.turn >= room.players.length) {
    room.turn = 0;
  }

  emitRoom(room);

  console.log(
    `${socket.id} saiu da sala ${room.id}.`
  );
}


const server = createServer((req, res) => {
  handle(req, res);
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Conectado:", socket.id);

  socket.emit("rooms-update", getRoomsSummary());


  // Entrada em uma das duas salas.
  socket.on("join-room", ({ roomId, name }) => {
    const room = rooms[roomId];

    if (!room) {
      socket.emit("join-error", "Sala inválida.");
      return;
    }

    if (room.locked || room.status !== "waiting") {
      socket.emit(
        "join-error",
        "Esta sala já iniciou uma partida e está bloqueada."
      );
      return;
    }

    if (room.players.length >= MAX_PLAYERS) {
      socket.emit("join-error", "Sala lotada.");
      return;
    }

    if (!name || !name.trim()) {
      socket.emit("join-error", "Informe seu nome.");
      return;
    }

    const player = {
      id: socket.id,
      name: name.trim().slice(0, 20),
      color: null,
      pos: 0,
      ready: false,
    };

    room.players.push(player);

    socket.join(roomId);
    socket.data.roomId = roomId;

    socket.emit("joined-room", {
      playerId: player.id,
      roomId,
    });

    emitRoom(room);
  });

  socket.on("select-color", (color) => {
    const room = rooms[socket.data.roomId];

    if (!room || room.status !== "waiting") return;

    const player = room.players.find(
      (item) => item.id === socket.id
    );

    if (!PLAYER_COLORS.includes(color)) {
      socket.emit("game-error", "Cor inválida.");
      return;
    }

    const colorInUse = room.players.some(
      (item) => item.id !== socket.id && item.color === color
    );

    if (colorInUse) {
      socket.emit("game-error", "Essa cor já foi escolhida por outro jogador.");
      return;
    }

    player.color = color;

    emitRoom(room);
  });

  // Jogador marca ou desmarca Pronto.
  socket.on("toggle-ready", () => {
    const room = rooms[socket.data.roomId];

    if (!room || room.status !== "waiting") return;

    const player = room.players.find(
      (item) => item.id === socket.id
    );

    if (!player) return;
    player.ready = !player.ready;

    emitRoom(room);
    startGame(room);
  });

  // Somente o jogador da vez pode rolar.
  socket.on("roll-dice", () => {
    const room = rooms[socket.data.roomId];

    if (!room || room.status !== "playing") return;
    if (room.pendingQuestion || room.animation) return;

    const player = room.players[room.turn];

    if (!player || player.id !== socket.id) return;

    const dice = Math.floor(Math.random() * 6) + 1;

    const from = player.pos;
    const to = Math.min(from + dice, FINISH_POSITION);

    const duration = 1200;

    room.animation = {
      playerId: player.id,
      dice,
      from,
      to,
    };

    io.to(room.id).emit("roll-animation", {
      playerId: player.id,
      dice,
      from,
      to,
      duration,
    });

    emitRoom(room);

    setTimeout(() => {
      // Impede que uma animação antiga altere uma sala que já foi reiniciada.
      if (
        room.status !== "playing" ||
        room.animation?.playerId !== player.id
      ) {
        return;
      }

      const currentPlayer = room.players.find(
        (item) => item.id === player.id
      );

      if (!currentPlayer) return;

      currentPlayer.pos = to;
      room.animation = null;

      io.to(room.id).emit("roll-result", {
        playerId: player.id,
        dice,
        from,
        position: to,
      });

      // Vitória ao alcançar a última casa.
      if (to >= FINISH_POSITION) {
        room.winner = {
          id: player.id,
          name: player.name,
        };

        room.status = "finished";

        io.to(room.id).emit("game-won", room.winner);
        emitRoom(room);
        return;
      }

      const level = getQuestionLevel(to);
      const question = getRandomQuestion(level);

      if (!question) {
        socket.emit(
          "game-error",
          "Não foi possível carregar uma pergunta."
        );

        nextTurn(room);
        emitRoom(room);
        return;
      }

      room.pendingQuestion = {
        playerId: player.id,
        previousPosition: from,
        newPosition: to,
        dice,
        question,
      };

      socket.emit("your-question", {
        pergunta: question.pergunta,
        opcoes: question.opcoes,
        nivel: level,
      });

      emitRoom(room);
    }, duration);
  });

  // Resposta da pergunta.
  socket.on("answer-question", (answer) => {
    const room = rooms[socket.data.roomId];

    if (!room || room.status !== "playing") return;

    const pending = room.pendingQuestion;

    if (!pending || pending.playerId !== socket.id) return;

    const player = room.players.find(
      (item) => item.id === socket.id
    );

    if (!player) return;

    const correct =
      String(answer).trim() ===
      String(pending.question.resposta).trim();

    const oldPosition = player.pos;

    if (!correct) {
      player.pos = pending.previousPosition;
    }

    room.pendingQuestion = null;

    io.to(room.id).emit("answer-result", {
      playerId: player.id,
      playerName: player.name,
      correct,
      selectedAnswer: answer,
      correctAnswer: pending.question.resposta,
      fromPosition: oldPosition,
      position: player.pos,
    });

    if (correct && player.pos >= FINISH_POSITION) {
      room.winner = {
        id: player.id,
        name: player.name,
      };

      room.status = "finished";

      io.to(room.id).emit("game-won", room.winner);
      emitRoom(room);
      return;
    }

    nextTurn(room);
    emitRoom(room);
  });


  socket.on("restart-game", () => {
    const room = rooms[socket.data.roomId];

    if (!room || room.status !== "finished") return;

    // Avisa todos os participantes que a sala foi liberada.
    io.to(room.id).emit("room-reset");

    // Retira os sockets da sala anterior.
    room.players.forEach((player) => {
      const connectedSocket = io.sockets.sockets.get(player.id);

      if (connectedSocket) {
        connectedSocket.leave(room.id);
        connectedSocket.data.roomId = null;
      }
    });

    // Limpa a partida e libera a sala.
    resetRoom(room);

    io.emit("rooms-update", getRoomsSummary());

    console.log(`Sala ${room.id} liberada para uma nova partida.`);
  });

  socket.on("leave-room", () => {
    removePlayerFromRoom(socket);
  });

  socket.on("disconnect", () => {
    removePlayerFromRoom(socket);
  });

  socket.on("get-room-state", () => {
    const room = rooms[socket.data.roomId];

    if (room) {
      socket.emit("game-state", publicRoom(room));
    }
  });
});

app.prepare().then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});
