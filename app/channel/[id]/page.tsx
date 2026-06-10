import Link from 'next/link';
import { notFound } from 'next/navigation';
import he from 'he';
import {
  getChannelDetail,
  getChannelPlaylists,
  getPlaylistVideosPage,
} from '@/lib/youtube';
import PlaylistPreviewSection from '@/app/components/playlist-preview-section';
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
    getChannelPlaylists(id, 20),
  ]);

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-500"
        >
          ← 검색으로 돌아가기
        </Link>

        <section className="flex flex-col gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-center">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border border-blue-200 bg-white">
            {channel.thumbnailUrl ? (
              <img
                src={channel.thumbnailUrl}
                alt={channel.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                채널
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Channel
            </p>
            <h1 className="text-2xl font-bold leading-tight text-slate-950">
              {he.decode(channel.title)}
            </h1>
            {channel.description && (
              <p className="max-w-3xl text-sm leading-6 text-slate-600 line-clamp-3">
                {he.decode(channel.description)}
              </p>
            )}
          </div>
        </section>

        {playlists.length > 0 && (
          <section className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Playlists
              </p>
              <h2 className="text-xl font-semibold text-slate-950">
                채널 플레이리스트
              </h2>
            </div>

            <div className="space-y-6">
              {playlists.map((playlist) => (
                <PlaylistPreviewSection
                  key={playlist.playlistId}
                  playlist={playlist}
                />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Videos
            </p>
            <h2 className="text-xl font-semibold text-slate-950">
              채널 전체 영상
            </h2>
          </div>

          {channel.uploadsPlaylistId ? (
            <VideoList
              playlistId={channel.uploadsPlaylistId}
              initialVideos={videos.videos}
              initialNextPageToken={videos.nextPageToken}
              emptyMessage="표시할 영상이 없어요."
            />
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              표시할 영상이 없어요.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
