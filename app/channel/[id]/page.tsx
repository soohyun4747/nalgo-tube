import Link from 'next/link';
import { notFound } from 'next/navigation';
import he from 'he';
import {
  getChannelDetail,
  getChannelPlaylists,
  getPlaylistVideosPage,
} from '@/lib/youtube';
import VideoList from '@/app/components/video-list';

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const channel = await getChannelDetail(id);

  if (!channel) {
    notFound();
  }

  const [videos, playlists] = await Promise.all([
    channel.uploadsPlaylistId
      ? getPlaylistVideosPage(channel.uploadsPlaylistId)
      : { videos: [], nextPageToken: null },
    getChannelPlaylists(id),
  ]);

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

        {playlists.length > 0 && (
          <section className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                Playlists
              </p>
              <h2 className="text-xl font-semibold text-zinc-50">
                채널 플레이리스트
              </h2>
            </div>

            <ul className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2">
              {playlists.map((playlist) => (
                <li
                  key={playlist.playlistId}
                  className="w-64 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
                >
                  <Link
                    href={`/playlist/${playlist.playlistId}`}
                    className="block h-full transition hover:bg-zinc-900/70"
                  >
                    <div className="aspect-video overflow-hidden bg-zinc-900">
                      {playlist.thumbnailUrl ? (
                        <img
                          src={playlist.thumbnailUrl}
                          alt={playlist.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                          No Thumbnail
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <h3 className="text-sm font-semibold leading-5 text-zinc-50 line-clamp-2">
                        {he.decode(playlist.title)}
                      </h3>
                      <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
                        <span>{playlist.itemCount}개 영상</span>
                        <span className="rounded-md bg-emerald-500 px-2.5 py-1 font-semibold text-zinc-950">
                          모두 재생
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Videos
            </p>
            <h2 className="text-xl font-semibold text-zinc-50">
              채널 전체 영상
            </h2>
            <p className="text-sm text-zinc-400">
              릴스를 제외한 전체 업로드를 계속 불러올 수 있어요.
            </p>
          </div>

          {channel.uploadsPlaylistId ? (
            <VideoList
              playlistId={channel.uploadsPlaylistId}
              initialVideos={videos.videos}
              initialNextPageToken={videos.nextPageToken}
              emptyMessage="표시할 영상이 없어요."
            />
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
