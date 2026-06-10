import { notFound } from "next/navigation";
import BackButton from "@/app/components/back-button";
import YouTubeEmbed from "@/app/components/youtube-embed";
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
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = await getVideoDetail(id);

  if (!video) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <BackButton />

        <YouTubeEmbed
          src={`https://www.youtube.com/embed/${id}`}
          title={video.title}
        />

        <div className="space-y-3">
          <h1 className="text-2xl font-bold leading-tight text-slate-950">
            {video.title}
          </h1>
          <p className="text-sm text-slate-500">
            {video.channelTitle} · {formatDate(video.publishedAt)}
          </p>
          <p className="text-sm leading-relaxed text-slate-700 line-clamp-10">
            {video.description}
          </p>
        </div>
      </div>
    </main>
  );
}
