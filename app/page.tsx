export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="max-w-md rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-8 shadow-lg">
        <h1 className="text-xl font-semibold">NoRec App</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Next.js + Capacitor 기반 앱입니다.
        </p>
        <p className="mt-4 text-xs text-zinc-500">
          나중에 여기서 유튜브 검색/구독 기반 뷰어, 다른 기능 등을 붙이면 됩니다.
        </p>
      </div>
    </main>
  );
}
