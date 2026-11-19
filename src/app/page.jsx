
"use client";

import { useRouter } from "next/navigation";
import localFont from "next/font/local";

const lostInSouth = localFont({
  src: "../../public/Bouncy-Black-PERSONAL_USE_ONLY.otf",
  display: "swap",
});

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen w-full relative overflow-hidden bg-[#063D2B] text-white flex items-center justify-center">

      {/* FUNDO */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#087C45] via-[#075B38] to-[#063D2B]" />

      {/* FORMAS DECORATIVAS */}
      <div className="absolute -top-40 -left-40 w-[450px] h-[450px] rounded-full bg-[#F5D547]/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-32 w-[500px] h-[500px] rounded-full bg-[#2879B9]/20 blur-3xl" />

      {/* ELEMENTO INSPIRADO NA BANDEIRA */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(75vw,650px)] aspect-square rotate-45 bg-[#F5D547]/10 rounded-[3rem] border border-[#F5D547]/20" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(45vw,380px)] aspect-square rounded-full bg-[#2879B9]/10 border border-white/10" />

      {/* ESTRELAS DECORATIVAS */}
      <div className="absolute top-[12%] left-[12%] text-[#F5D547] text-2xl opacity-70">★</div>
      <div className="absolute top-[20%] right-[18%] text-white text-xl opacity-50">★</div>
      <div className="absolute top-[38%] left-[7%] text-[#F5D547] text-xl opacity-60">★</div>
      <div className="absolute top-[35%] right-[9%] text-white text-2xl opacity-50">★</div>
      <div className="absolute bottom-[25%] left-[15%] text-white text-xl opacity-50">★</div>
      <div className="absolute bottom-[18%] right-[15%] text-[#F5D547] text-2xl opacity-70">★</div>
      <div className="absolute bottom-[10%] left-[40%] text-white text-xl opacity-40">★</div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center text-center px-5 py-28 gap-8">

        {/* IDENTIFICAÇÃO */}
        <div className="bg-white/10 border border-white/20 rounded-full px-6 py-2 backdrop-blur-sm shadow-lg">
          <span className="text-[#F5D547] text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em]">
            Uma aventura pelo Brasil
          </span>
        </div>

        {/* TÍTULO */}
        <div className={`${lostInSouth.className} text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-[#F5D547] leading-tight tracking-wide drop-shadow-[0_8px_0_rgba(0,0,0,0.2)]`}>
          BRASIL
          <br />
          CONTINENTAL
        </div>

        {/* SUBTÍTULO */}
        <p className="max-w-xl text-base sm:text-lg md:text-xl text-white/90 font-semibold leading-relaxed">
          Explore as regiões, descubra culturas e conhecimentos e embarque
          em uma aventura pela diversidade brasileira!
        </p>

        {/* ELEMENTOS COLORIDOS */}
        <div className="flex items-center gap-3">
          <span className="w-10 h-2 rounded-full bg-[#087C45]" />
          <span className="w-10 h-2 rounded-full bg-[#F5D547]" />
          <span className="w-10 h-2 rounded-full bg-[#2879B9]" />
        </div>

        {/* BOTÃO JOGAR */}
        <button
          onClick={() => router.push("/rooms")}
          className="group relative px-16 py-5 text-xl font-extrabold mt-2"
        >
          {/* EFEITO DE LUZ */}
          <div className="absolute inset-0 bg-[#F5D547]/30 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300" />

          {/* FUNDO */}
          <div className="absolute inset-0 bg-[#F5D547] rounded-2xl shadow-xl group-hover:scale-110 transition duration-300" />

          {/* BORDA */}
          <div className="absolute inset-0 rounded-2xl border-2 border-white/70 group-hover:scale-110 transition duration-300" />

          {/* TEXTO */}
          <span className="relative z-10 flex items-center gap-3 text-[#17452F]">
            JOGAR
            <span className="text-[#087C45] text-2xl group-hover:translate-x-2 transition-transform">
              ➜
            </span>
          </span>
        </button>

        {/* RODAPÉ */}
        <p className="text-white/50 text-xs sm:text-sm font-semibold tracking-widest uppercase mt-4">
          Conhecimento • Cultura • Diversidade
        </p>

      </div>

      {/* LINHA INFERIOR */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[#087C45] via-[#F5D547] to-[#2879B9]" />

    </main>
  );
}
