
"use client";

import { useEffect, useState } from "react";

export default function Questionario({
  question,
  onAnswer,
  feedback,
}) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    setSelected(null);
    setAnswered(false);
  }, [question]);

  if (!question) return null;

  function handleClick(option) {
    if (answered || feedback) return;

    setSelected(option);
    setAnswered(true);
    onAnswer(option);
  }

  const resultReceived = feedback != null;
  const correct = feedback?.correct;

  return (
    <div className="bg-[#062d25]/75 backdrop-blur-sm flex items-center justify-center p-4 rounded-2xl">
      <div className="relative bg-white p-7 sm:p-8 rounded-[2rem] w-full max-w-[480px] shadow-2xl border-4 border-[#F5D547] overflow-hidden">

        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#087C45] via-[#F5D547] to-[#2879B9]" />

        <div className="flex justify-center mb-5 mt-2">
          <span className="bg-[#087C45] text-white text-xs font-extrabold uppercase tracking-widest px-5 py-2 rounded-full shadow-md">
            Brasil Continental
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold mb-7 text-center text-[#17452F] leading-snug">
          {question.pergunta}
        </h2>

        <div className="flex flex-col gap-3">
          {question.opcoes.map((op, i) => {
            const isSelected = selected === op;
            const isCorrectAnswer =
              resultReceived &&
              String(feedback.correctAnswer).trim() === String(op).trim();

            let style =
              "bg-[#087C45] text-white border-[#087C45]";

            if (isSelected && !resultReceived) {
              style = "bg-blue-600 text-white border-blue-600";
            }

            if (resultReceived && isSelected) {
              style = correct
                ? "bg-green-600 text-white border-green-600"
                : "bg-red-600 text-white border-red-600";
            }

            if (isCorrectAnswer && !correct) {
              style = "bg-green-500 text-white border-green-500";
            }

            return (
              <button
                key={i}
                onClick={() => handleClick(op)}
                disabled={answered || resultReceived}
                className={`
                  w-full p-4 rounded-2xl font-bold text-left
                  border-2 shadow-md transition-all duration-200
                  flex items-center gap-3
                  ${style}
                  ${answered ? "cursor-default" : "hover:scale-[1.02]"}
                `}
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-sm font-extrabold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>

                <span className="flex-1">{op}</span>

                {resultReceived && isSelected && (
                  <span className="text-xl">
                    {correct ? "✓" : "✕"}
                  </span>
                )}

                {resultReceived && isCorrectAnswer && !correct && (
                  <span className="text-xl">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {resultReceived && (
          <div
            className={`mt-5 rounded-xl p-4 text-center font-black ${
              correct
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {correct
              ? "✓ Resposta correta! Você avançou!"
              : "✕ Resposta incorreta! Você voltou à posição anterior."}
          </div>
        )}

        {!answered && (
          <p className="mt-5 text-center text-sm text-gray-500">
            Selecione uma alternativa.
          </p>
        )}

        {answered && !resultReceived && (
          <p className="mt-5 text-center text-sm font-bold text-gray-500">
            Aguardando confirmação da resposta...
          </p>
        )}
      </div>
    </div>
  );
}
