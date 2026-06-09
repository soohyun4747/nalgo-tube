import Link from 'next/link';
import { notFound } from 'next/navigation';
import he from 'he';
import { getChannelDetail, getChannelVideos } from '@/lib/youtube';

function formatDate(iso: string) {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [channel, videos] = await Promise.all([
    getChannelDetail(id),
    getChannelVideos(id),
  ]);

  if (!channel) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
        >
          ← 검색으로 돌아가기
        </Link>

        <section className="flex flex-col gap-5 border-b border-zinc-800 pb-8 sm:flex-row sm:items-center">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border border-emerald-800 bg-zinc-950">
            {channel.thumbnailUrl ? (
              <img
                src={channel.thumbnailUrl}
                alt={channel.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                채널
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Channel
            </p>
            <h1 className="text-2xl font-bold leading-tight text-zinc-50">
              {he.decode(channel.title)}
            </h1>
            {channel.description && (
              <p className="max-w-3xl text-sm leading-6 text-zinc-300 line-clamp-3">
                {he.decode(channel.description)}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Videos
            </p>
            <h2 className="text-xl font-semibold text-zinc-50">
              채널 최신 영상
            </h2>
          </div>

          {videos.length > 0 ? (
            <ul className="space-y-4">
              {videos.map((video) => (
                <li
                  key={video.videoId}
                  className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
                >
                  <Link
                    href={`/watch/${video.videoId}`}
                    className="flex flex-col gap-4 p-4 transition hover:bg-zinc-900/70 sm:flex-row"
                  >
                    <div className="aspect-video w-full max-w-xs overflow-hidden rounded-md bg-zinc-900">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                          No Thumbnail
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-2">
                      <h3 className="text-lg font-semibold text-zinc-50 line-clamp-2">
                        {he.decode(video.title)}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        {he.decode(video.channelTitle)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDate(video.publishedAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-8 text-center text-sm text-zinc-400">
              표시할 영상이 없어요.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
