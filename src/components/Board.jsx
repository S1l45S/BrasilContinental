
"use client";

import { useRef, useEffect, useState, useMemo } from "react";

export default function Board({ players, boardData }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  const BASE_WIDTH = 1200;
  const BASE_HEIGHT = 750;

  // Coordenadas em espiral, do exterior para o centro.
  const positions = useMemo(() => {
    const result = [];
    const cols = 7;
    const rows = 5;

    let left = 0;
    let right = cols - 1;
    let top = 0;
    let bottom = rows - 1;

    while (left <= right && top <= bottom) {
      for (let x = left; x <= right; x++) {
        result.push({ x, y: top });
      }
      top++;

      for (let y = top; y <= bottom; y++) {
        result.push({ x: right, y });
      }
      right--;

      if (top <= bottom) {
        for (let x = right; x >= left; x--) {
          result.push({ x, y: bottom });
        }
        bottom--;
      }

      if (left <= right) {
        for (let y = bottom; y >= top; y--) {
          result.push({ x: left, y });
        }
        left++;
      }
    }

    // Remove o excesso e centraliza as casas.
    return result.slice(0, boardData.length).map((p) => ({
      x: 90 + p.x * 170,
      y: 90 + p.y * 140,
    }));
  }, [boardData.length]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateScale = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;

      setScale({
        x: width / BASE_WIDTH,
        y: height / BASE_HEIGHT,
      });
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const getCellColor = (cell) => {
    if (cell.area === "inicio") return "#F5C542";
    if (cell.area === "final") return "#087C45";

    switch (cell.nivel) {
      case "facil":
        return "#239B56";
      case "medio":
        return "#E8B923";
      case "dificil":
        return "#2879B9";
      default:
        return "#FFFFFF";
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#e5f5df] via-[#fff7d6] to-[#d9edfa]">

      {/* Decoração brasileira */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute left-10 top-10 text-6xl text-green-700/10">✦</span>
        <span className="absolute right-16 top-20 text-7xl text-yellow-500/20">✦</span>
        <span className="absolute bottom-10 left-1/4 text-8xl text-blue-600/10">✦</span>
        <span className="absolute bottom-20 right-10 text-7xl text-green-700/10">✦</span>

        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-5xl opacity-20">
          🌴
        </div>
        <div className="absolute right-8 top-1/3 text-5xl opacity-20">
          🌿
        </div>
        <div className="absolute bottom-8 left-1/2 text-5xl opacity-20">
          🌺
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-5 px-3 py-6">

        {/* Título */}
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-[0.3em] text-green-800">
            Uma viagem pelo Brasil
          </span>

          <h1 className="mt-1 text-3xl font-black text-[#125B36] md:text-5xl">
            BRASIL CONTINENTAL
          </h1>

          <p className="mt-1 text-sm font-medium text-[#48634E]">
            Conheça culturas, histórias e tradições!
          </p>
        </div>

        {/* Tabuleiro */}
        <div
          ref={containerRef}
          className="relative h-[75vh] max-h-[750px] w-[95vw] max-w-[1200px] overflow-hidden rounded-[32px] border-[6px] border-white/80 bg-white/60 shadow-2xl backdrop-blur-sm"
        >

          {/* Bandeira decorativa central */}
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center">
            <div className="flex h-36 w-52 items-center justify-center rounded-[45%] bg-[#229C54] shadow-lg md:h-44 md:w-64">
              <div className="flex h-24 w-36 items-center justify-center bg-[#F5D547] [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)] md:h-28 md:w-44">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#236BB4] md:h-16 md:w-16">
                  <span className="text-[8px] font-bold text-white md:text-[10px]">
                    BRASIL
                  </span>
                </div>
              </div>
            </div>
            <span className="mt-3 text-sm font-black tracking-widest text-green-900">
              NOSSA DIVERSIDADE
            </span>
          </div>

          {/* Casas */}
          {boardData.map((cell, i) => {
            const p = positions[i];

            if (!p) return null;

            return (
              <div
                key={i}
                className="absolute z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl border-[3px] border-white text-white shadow-lg transition-transform hover:scale-110 md:h-[76px] md:w-[76px]"
                style={{
                  left: p.x * scale.x,
                  top: p.y * scale.y,
                  backgroundColor: getCellColor(cell),
                  color: cell.nivel === "medio" ? "#604500" : "white",
                }}
              >
                <span className="text-base font-black md:text-xl">
                  {cell.casa}
                </span>

                {cell.area === "inicio" ? (
                  <span className="text-[8px] font-black md:text-[10px]">
                    INÍCIO
                  </span>
                ) : cell.area === "final" ? (
                  <span className="text-[8px] font-black md:text-[10px]">
                    FINAL
                  </span>
                ) : (
                  <span className="text-[7px] font-bold uppercase md:text-[9px]">
                    {cell.nivel}
                  </span>
                )}
              </div>
            );
          })}

          {/* Peões */}
          {players.map((player, i) => {
            const p = positions[player.pos];

            if (!p) return null;

            return (
              <div
                key={player.id ?? i}
                className="absolute z-20"
                style={{
                  left: p.x * scale.x,
                  top: p.y * scale.y,
                  transform: `translate(-50%, -100%) translateX(${(i - (players.length - 1) / 2) * 12}px)`,
                  transition: "left 0.5s ease, top 0.5s ease",
                }}
              >
                <div className="flex flex-col items-center drop-shadow-md">
                  <div
                    className="h-4 w-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: player.color }}
                  />
                  <div
                    className="-mt-1 h-6 w-5 rounded-full border-2 border-white"
                    style={{ backgroundColor: player.color }}
                  />
                  <div
                    className="-mt-1 h-2 w-8 rounded-full border border-white"
                    style={{ backgroundColor: player.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap justify-center gap-3 rounded-2xl bg-white/80 px-5 py-3 shadow-md">
          <Legend color="#239B56" label="Fácil" />
          <Legend color="#E8B923" label="Médio" />
          <Legend color="#2879B9" label="Difícil" />
          <Legend color="#F5C542" label="Início" />
          <Legend color="#087C45" label="Final" />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
      <span
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );
}
