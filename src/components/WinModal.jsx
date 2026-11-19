
"use client";

import { useRouter } from "next/navigation";

export default function WinModal({ winner, onRestart }) {
  const router = useRouter();

  if (!winner) return null;

  return (
    <div className="fixed inset-0 bg-[#062d25]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">

      {/* CARD EXTERNO */}
      <div className="relative bg-gradient-to-br from-[#087C45] via-[#F5D547] to-[#2879B9] p-[4px] rounded-[2rem] shadow-2xl w-full max-w-[440px]">

        {/* CONTEÚDO */}
        <div className="bg-[#073D2B] text-white p-8 sm:p-10 rounded-[1.8rem] text-center relative overflow-hidden">

          {/* DECORAÇÕES */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#087C45]/40 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-[#2879B9]/40 rounded-full blur-2xl" />

          <span className="absolute top-5 left-6 text-[#F5D547] text-2xl">★</span>
          <span className="absolute top-7 right-7 text-white/50 text-xl">★</span>
          <span className="absolute bottom-7 left-8 text-white/40 text-xl">★</span>
          <span className="absolute bottom-5 right-8 text-[#F5D547] text-2xl">★</span>

          {/* CONTEÚDO PRINCIPAL */}
          <div className="relative z-10">

            {/* TROFÉU */}
            <div className="mx-auto mb-5 w-24 h-24 rounded-full bg-[#F5D547] flex items-center justify-center shadow-lg border-4 border-white/30">
              <span className="text-6xl">🏆</span>
            </div>

            {/* TÍTULO */}
            <h1 className="text-3xl sm:text-4xl font-black mb-3 tracking-wide text-[#F5D547]">
              Vitória!
            </h1>

            <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-5">
              Brasil Continental
            </p>

            {/* VENCEDOR */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 mb-8">
              <p className="text-white/80 text-base mb-2">
                O grande vencedor foi
              </p>

              <span
                className="font-black text-2xl sm:text-3xl block break-words"
                style={{ color: winner.color || "#F5D547" }}
              >
                {winner.name}
              </span>

              <p className="text-[#F5D547] font-bold mt-2">
                Parabéns pela conquista!
              </p>
            </div>

            {/* BOTÕES */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">

              {/* JOGAR NOVAMENTE */}
              <button
                onClick={onRestart}
                className="px-6 py-3 rounded-xl font-extrabold bg-[#F5D547] text-[#17452F] hover:bg-[#ffe779] transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                ↻ Jogar novamente
              </button>

              {/* SAIR */}
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 rounded-xl font-bold border-2 border-white/70 text-white hover:bg-white/15 transition-all hover:scale-105 active:scale-95"
              >
                Sair
              </button>

            </div>

            {/* DETALHE INFERIOR */}
            <div className="flex justify-center items-center gap-2 mt-8">
              <span className="w-3 h-3 rounded-full bg-[#087C45]" />
              <span className="w-3 h-3 rotate-45 bg-[#F5D547]" />
              <span className="w-3 h-3 rounded-full bg-[#2879B9]" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
