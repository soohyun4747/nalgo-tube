import Link from "next/link";
import { notFound } from "next/navigation";
import { getVideoDetail } from "@/lib/youtube";

function formatDate(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function WatchPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const video = await getVideoDetail(id);

  if (!video) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
        >
          ← 뒤로가기
        </Link>

        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${id}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold leading-tight text-zinc-50">
            {video.title}
          </h1>
          <p className="text-sm text-zinc-400">
            {video.channelTitle} · {formatDate(video.publishedAt)}
          </p>
          <p className="text-sm leading-relaxed text-zinc-200 line-clamp-10">
            {video.description}
          </p>
        </div>
      </div>
    </main>
  );
}
