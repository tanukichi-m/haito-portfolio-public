import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { FloatingCharacter } from "@/components/FloatingCharacter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "さいふちゃんの配当ポートフォリオ診断",
  description: "高配当投資家向けポートフォリオ最適化アプリ",
};

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: "📊" },
  { href: "/holdings", label: "保有銘柄", icon: "📋" },
  { href: "/diagnosis", label: "診断結果", icon: "🔍" },
  { href: "/recommendations", label: "次の一手", icon: "🎯" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-slate-50 min-h-screen`}>
        <div className="flex flex-col min-h-screen">
          <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <span className="font-black text-slate-800 text-sm sm:text-base">
                  さいふちゃんの配当ポートフォリオ診断
                </span>
              </Link>
              <nav className="hidden sm:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-20 sm:pb-6">
            {children}
          </main>
          <FloatingCharacter />

          <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </body>
    </html>
  );
}