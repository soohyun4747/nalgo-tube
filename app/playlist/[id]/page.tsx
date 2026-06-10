import { notFound } from 'next/navigation';
import he from 'he';
import { getPlaylistDetail, getPlaylistVideosPage } from '@/lib/youtube';
import BackButton from '@/app/components/back-button';
import VideoList from '@/app/components/video-list';
import YouTubeEmbed from '@/app/components/youtube-embed';

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [playlist, videos] = await Promise.all([
    getPlaylistDetail(id),
    getPlaylistVideosPage(id),
  ]);

  if (!playlist) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <BackButton />

        <section className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Playlist
            </p>
            <h1 className="text-2xl font-bold leading-tight text-slate-950">
              {he.decode(playlist.title)}
            </h1>
            {playlist.description && (
              <p className="max-w-3xl text-sm leading-6 text-slate-600 line-clamp-3">
                {he.decode(playlist.description)}
              </p>
            )}
          </div>

          <YouTubeEmbed
            src={`https://www.youtube.com/embed/videoseries?list=${id}`}
            title={playlist.title}
          />
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Videos
            </p>
            <h2 className="text-xl font-semibold text-slate-950">
              플레이리스트 영상
            </h2>
          </div>

          <VideoList
            playlistId={id}
            initialVideos={videos.videos}
            initialNextPageToken={videos.nextPageToken}
            emptyMessage="표시할 영상이 없어요."
          />
        </section>
      </div>
    </main>
  );
}
