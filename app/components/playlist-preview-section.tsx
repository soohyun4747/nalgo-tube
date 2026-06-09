'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import he from 'he';
import HorizontalScroll from '@/app/components/horizontal-scroll';

type Playlist = {
  playlistId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  itemCount: number;
};

type Video = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
};

type PlaylistVideosResponse = {
  videos: Video[];
  nextPageToken: string | null;
  error?: string;
};

type PlaylistPreviewSectionProps = {
  playlist: Playlist;
};

export default function PlaylistPreviewSection({
  playlist,
}: PlaylistPreviewSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || hasLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;

        observer.disconnect();
        setHasLoaded(true);
        setLoading(true);

        const params = new URLSearchParams({
          playlistId: playlist.playlistId,
          maxResults: '12',
        });

        fetch('/api/playlist-videos?' + params.toString())
          .then((res) => {
            if (!res.ok) {
              throw new Error('Playlist preview request failed');
            }
            return res.json() as Promise<PlaylistVideosResponse>;
          })
          .then((data) => {
            if (data.error) {
              throw new Error(data.error);
            }
            setVideos(data.videos);
          })
          .catch((error) => {
            console.warn(error);
            setErrorMsg('영상을 불러오지 못했어요.');
          })
          .finally(() => {
            setLoading(false);
          });
      },
      { rootMargin: '500px 0px' }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasLoaded, playlist.playlistId]);

  return (
    <section ref={sectionRef} className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-base font-semibold text-slate-950">
            {he.decode(playlist.title)}
          </h3>
          <p className="text-xs text-slate-500">{playlist.itemCount}개 영상</p>
        </div>
        <Link
          href={`/playlist/${playlist.playlistId}`}
          className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
        >
          모두 재생
        </Link>
      </div>

      {loading && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          영상 불러오는 중...
        </div>
      )}

      {!loading && errorMsg && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && videos.length > 0 && (
        <HorizontalScroll label={playlist.title}>
          {videos.map((video) => (
            <Link
              key={video.videoId}
              href={`/watch/${video.videoId}`}
              className="w-56 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:bg-slate-100/70"
            >
              <div className="aspect-video overflow-hidden bg-slate-100">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">
                    No Thumbnail
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold leading-5 text-slate-950 line-clamp-2">
                  {he.decode(video.title)}
                </p>
              </div>
            </Link>
          ))}
        </HorizontalScroll>
      )}

      {!loading && !errorMsg && hasLoaded && videos.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          미리 볼 영상이 없어요.
        </div>
      )}
    </section>
  );
}
