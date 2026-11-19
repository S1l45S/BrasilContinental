"use client";

import { useRef, useEffect, useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/* Estilos das casas                                                   */
/* ------------------------------------------------------------------ */

const LEVEL_STYLE = {
  facil: { from: "#3DBB74", to: "#1E8449", text: "#FFFFFF" },
  medio: { from: "#F8D65A", to: "#DFA10F", text: "#5A4000" },
  dificil: { from: "#52A3E0", to: "#1F6AA8", text: "#FFFFFF" },
};
const START_STYLE = { from: "#FFA94D", to: "#E8621F", text: "#FFFFFF" };
const END_STYLE = { from: "#12A15C", to: "#064D30", text: "#F5D547" };

const AREA_LABEL = {
  sul: "Sul",
  sudeste: "Sudeste",
  "centro-oeste": "C-Oeste",
};

function getCellStyle(cell) {
  if (cell.area === "inicio") return START_STYLE;
  if (cell.area === "fim" || cell.area === "final") return END_STYLE;
  return LEVEL_STYLE[cell.nivel] ?? LEVEL_STYLE.facil;
}

/* ------------------------------------------------------------------ */
/* Caminho em espiral (anel externo da grade)                          */
/* ------------------------------------------------------------------ */

function buildSpiral(cols, rows, length) {
  const result = [];

  let left = 0;
  let right = cols - 1;
  let top = 0;
  let bottom = rows - 1;

  while (left <= right && top <= bottom) {
    for (let c = left; c <= right; c++) result.push({ col: c, row: top });
    top++;

    for (let r = top; r <= bottom; r++) result.push({ col: right, row: r });
    right--;

    if (top <= bottom) {
      for (let c = right; c >= left; c--) result.push({ col: c, row: bottom });
      bottom--;
    }

    if (left <= right) {
      for (let r = bottom; r >= top; r--) result.push({ col: left, row: r });
      left++;
    }
  }

  return result.slice(0, length);
}

/* Maior tabuleiro que cabe na área: paisagem (7x5) ou retrato (5x7). */
function fitBoard(boxW, boxH) {
  const options = [
    { cols: 7, rows: 5 },
    { cols: 5, rows: 7 },
  ].map(({ cols, rows }) => {
    const ratio = cols / rows;
    const width = Math.floor(Math.min(boxW, boxH * ratio));
    return { cols, rows, width, height: Math.floor(width / ratio) };
  });

  return options[0].width * options[0].height >=
    options[1].width * options[1].height
    ? options[0]
    : options[1];
}

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

export default function Board({
  players,
  boardData,
  movement,
  onMovementComplete,
  currentPlayerId,
}) {
  const wrapperRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  // Mede a área disponível e se adapta a qualquer tamanho de tela.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setBox({ w: rect.width, h: rect.height });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const board =
    box.w > 0 && box.h > 0 ? fitBoard(box.w - 8, box.h - 8) : null;

  const cols = board?.cols ?? 7;
  const rows = board?.rows ?? 5;
  const portrait = rows > cols;
  const cell = board ? board.width / cols : 0;

  const positions = useMemo(
    () => buildSpiral(cols, rows, boardData.length),
    [cols, rows, boardData.length]
  );

  const [visualPositions, setVisualPositions] = useState({});

  // Sincroniza a posição visual com a posição oficial
  // quando não existe uma animação em andamento.
  useEffect(() => {
    if (movement) return;

    const updatedPositions = {};

    players.forEach((player) => {
      updatedPositions[player.id] = player.pos;
    });

    setVisualPositions(updatedPositions);
  }, [players, movement]);

  // Anima o peão casa por casa.
  useEffect(() => {
    if (!movement) return;

    const { playerId, from, to, stepDuration = 250 } = movement;

    const direction = to >= from ? 1 : -1;
    const totalSteps = Math.abs(to - from);

    let currentPosition = from;
    let stepsCompleted = 0;

    setVisualPositions((previous) => ({
      ...previous,
      [playerId]: from,
    }));

    if (totalSteps === 0) {
      onMovementComplete?.();
      return;
    }

    const interval = setInterval(() => {
      currentPosition += direction;
      stepsCompleted += 1;

      setVisualPositions((previous) => ({
        ...previous,
        [playerId]: currentPosition,
      }));

      if (stepsCompleted >= totalSteps) {
        clearInterval(interval);
        onMovementComplete?.();
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [movement, onMovementComplete]);

  // Agrupa peões que estão na mesma casa para não ficarem sobrepostos.
  const groups = {};
  players.forEach((player) => {
    const pos = visualPositions[player.id] ?? player.pos;
    (groups[pos] ||= []).push(player.id);
  });

  const labelFont = Math.max(7, Math.round(cell * 0.12));
  const legendFont = Math.max(9, Math.round(cell * 0.12));
  const emblemW = cell * (portrait ? 2.1 : 2.6);

  return (
    <div ref={wrapperRef} className="absolute inset-0 flex items-center justify-center">
      {board && (
        <div
          className="relative shrink-0"
          style={{
            width: board.width,
            height: board.height,
            borderRadius: cell * 0.32,
            background:
              "radial-gradient(circle at 18% 12%, #FFFDF2 0%, #FFF3C9 42%, #D7EFDF 100%)",
            boxShadow:
              "0 18px 40px rgba(0,0,0,0.35), inset 0 0 40px rgba(8,124,69,0.10)",
          }}
        >
          {/* Trilha pontilhada ligando as casas */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${cols} ${rows}`}
            preserveAspectRatio="none"
          >
            <polyline
              points={positions
                .map((p) => `${p.col + 0.5},${p.row + 0.5}`)
                .join(" ")}
              fill="none"
              stroke="rgba(15,124,69,0.35)"
              strokeWidth="0.12"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="0 0.26"
            />
          </svg>

          {/* Grade: casas + centro decorativo */}
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
          >
            {boardData.map((cellData, i) => {
              const p = positions[i];
              if (!p) return null;

              const style = getCellStyle(cellData);
              const isStart = cellData.area === "inicio";
              const isEnd =
                cellData.area === "fim" || cellData.area === "final";
              const number = cellData.casa.replace(/\D/g, "");

              return (
                <div
                  key={i}
                  style={{
                    gridColumn: p.col + 1,
                    gridRow: p.row + 1,
                    padding: cell * 0.055,
                  }}
                >
                  <div
                    className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden"
                    style={{
                      borderRadius: "24%",
                      background: `linear-gradient(145deg, ${style.from}, ${style.to})`,
                      color: style.text,
                      padding: `${cell * 0.05}px 0`,
                      boxShadow: `0 ${cell * 0.04}px 0 rgba(0,0,0,0.22), inset 0 0 0 ${Math.max(
                        2,
                        cell * 0.03
                      )}px rgba(255,255,255,0.9)`,
                    }}
                  >
                    {/* brilho */}
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/15"
                      style={{ borderRadius: "24% 24% 60% 60%" }}
                    />

                    <span
                      className="relative font-black leading-none"
                      style={{
                        fontSize: cell * (isStart || isEnd ? 0.26 : 0.28),
                        marginTop: cell * 0.04,
                      }}
                    >
                      {isStart ? "🚩" : isEnd ? "🏆" : number}
                    </span>

                    <span
                      className="relative font-extrabold uppercase leading-none tracking-wide"
                      style={{ fontSize: labelFont, marginBottom: cell * 0.04 }}
                    >
                      {isStart
                        ? "Início"
                        : isEnd
                        ? "Fim"
                        : AREA_LABEL[cellData.area] ?? cellData.nivel}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Centro: brasão + legenda */}
            <div
              className="flex flex-col items-center justify-center overflow-hidden text-center"
              style={{
                gridColumn: `2 / ${cols}`,
                gridRow: `2 / ${rows}`,
                gap: cell * 0.1,
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: emblemW,
                  height: emblemW * 0.68,
                  borderRadius: "45%",
                  background: "linear-gradient(145deg, #2DB563, #127A41)",
                  boxShadow: "0 8px 18px rgba(8,80,45,0.35)",
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: emblemW * 0.7,
                    height: emblemW * 0.46,
                    background: "#F5D547",
                    clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
                  }}
                >
                  <div
                    style={{
                      width: emblemW * 0.27,
                      height: emblemW * 0.27,
                      borderRadius: "50%",
                      background: "#236BB4",
                      border: `${Math.max(1, emblemW * 0.012)}px solid #fff`,
                    }}
                  />
                </div>
              </div>

              <span
                className="font-black uppercase text-[#125B36]"
                style={{
                  fontSize: Math.max(9, cell * 0.15),
                  letterSpacing: "0.12em",
                }}
              >
                Brasil Continental
              </span>

              <div
                className="flex flex-wrap items-center justify-center"
                style={{ gap: `${cell * 0.04}px ${cell * 0.12}px` }}
              >
                {[
                  ["facil", "Sul · Fácil"],
                  ["medio", "Sudeste · Médio"],
                  ["dificil", "C-Oeste · Difícil"],
                ].map(([level, label]) => (
                  <span
                    key={level}
                    className="inline-flex items-center font-bold text-[#2D4A38]"
                    style={{ fontSize: legendFont, gap: legendFont * 0.4 }}
                  >
                    <i
                      style={{
                        width: legendFont,
                        height: legendFont,
                        borderRadius: "30%",
                        background: LEVEL_STYLE[level].from,
                        display: "inline-block",
                      }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Moldura dourada */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: cell * 0.32,
              border: `${Math.max(3, cell * 0.05)}px solid #F5D547`,
              boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.6)",
            }}
          />

          {/* Peões */}
          {players.map((player, i) => {
            const visualPosition = visualPositions[player.id] ?? player.pos;
            const p = positions[visualPosition];
            if (!p) return null;

            const group = groups[visualPosition] ?? [player.id];
            const k = group.indexOf(player.id);
            const m = group.length;

            const angle = (2 * Math.PI * k) / m - Math.PI / 2;
            const radius = m > 1 ? cell * 0.2 : 0;
            const dx = Math.cos(angle) * radius;
            const dy = Math.sin(angle) * radius * 0.6;

            const pawnW = cell * 0.34;
            const isCurrent = player.id === currentPlayerId;

            return (
              <div
                key={player.id ?? i}
                className="pointer-events-none absolute"
                style={{
                  left: `${((p.col + 0.5) / cols) * 100}%`,
                  top: `${((p.row + 0.5) / rows) * 100}%`,
                  zIndex: isCurrent ? 30 : 20,
                  transform: `translate(calc(-50% + ${dx}px), calc(-52% + ${dy}px))`,
                  transition:
                    "left 0.25s ease-in-out, top 0.25s ease-in-out, transform 0.25s ease-in-out",
                }}
              >
                <div className="relative drop-shadow-[0_3px_3px_rgba(0,0,0,0.45)]">
                  {isCurrent && (
                    <span
                      className="absolute left-1/2 animate-ping rounded-full bg-white/70"
                      style={{
                        width: pawnW * 0.9,
                        height: pawnW * 0.9,
                        bottom: 0,
                        transform: "translateX(-50%)",
                      }}
                    />
                  )}
                  <svg
                    className="relative block"
                    viewBox="0 0 24 30"
                    width={pawnW}
                    height={pawnW * 1.25}
                  >
                    <ellipse cx="12" cy="27" rx="10" ry="3" fill="rgba(0,0,0,0.25)" />
                    <path
                      d="M12 8 C7 8 6 13 8.5 16 C6 18 4.5 22 3.5 25 H20.5 C19.5 22 18 18 15.5 16 C18 13 17 8 12 8Z"
                      fill={player.color}
                      stroke="#fff"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="6.5"
                      r="5"
                      fill={player.color}
                      stroke="#fff"
                      strokeWidth="1.6"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
