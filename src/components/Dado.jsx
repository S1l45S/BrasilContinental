
"use client";

export default function Dado({
  value = 1,
  rolling = false,
  disabled = true,
  onRoll,
}) {
  const patterns = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={disabled || rolling}
      aria-label={`Dado mostrando ${value}`}
      className={`
        group relative flex h-24 w-24 items-center justify-center
        rounded-[22px] border-[5px] border-white
        bg-gradient-to-br from-[#F9DC55] via-[#F5C52F] to-[#E8A91B]
        p-3 shadow-[0_8px_0_#146B3A,0_12px_20px_rgba(0,0,0,0.2)]
        transition-all duration-200
        ${rolling ? "animate-spin" : ""}
        ${disabled || rolling
          ? "cursor-not-allowed opacity-80"
          : "cursor-pointer hover:-translate-y-1"}
      `}
    >
      <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-1.5 rounded-lg bg-white/30 p-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`
              rounded-full transition-all duration-150
              ${patterns[value]?.includes(i)
                ? "scale-100 bg-[#087C45] shadow-sm"
                : "scale-75 bg-transparent"}
            `}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute left-3 top-2 h-2 w-7 rotate-[-25deg] rounded-full bg-white/50" />
    </button>
  );
}
