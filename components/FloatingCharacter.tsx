"use client";

import { useState } from "react";
import Image from "next/image";

export function FloatingCharacter() {
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("");

  const messages = [
    "高配当株で\n不労所得を増やそう！",
    "分散投資が\nリスク管理の基本だよ！",
    "配当金で\nバカンスに行くのが夢✨",
    "コツコツ積み上げて\n資産形成しよう！",
    "業種分散を\n意識してね！",
  ];

  const handleClick = () => {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setMessage(randomMessage);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 z-50 flex flex-col items-end gap-2">
      {showMessage && (
        <div className="bg-white border border-slate-200 rounded-2xl rounded-br-none px-4 py-3 shadow-lg max-w-48 text-sm text-slate-700 font-medium whitespace-pre-line animate-bounce-in">
          {message}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-white border-r border-b border-slate-200 transform translate-y-1/2 rotate-45" />
        </div>
      )}
      <button
        onClick={handleClick}
        className="hover:scale-110 transition-transform duration-200 drop-shadow-lg"
        title="さいふちゃんをクリック！"
      >
        <Image
          src="/character.png"
          alt="さいふちゃん"
          width={100}
          height={87}
          className="animate-float"
        />
      </button>
    </div>
  );
}