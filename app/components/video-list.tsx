'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import he from 'he';

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

type VideoListProps = {
  playlistId: string;
  initialVideos: Video[];
  initialNextPageToken: string | null;
  emptyMessage: string;
};

function formatDate(iso: string) {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function VideoList({
  playlistId,
  initialVideos,
  initialNextPageToken,
  emptyMessage,
}: VideoListProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [videos, setVideos] = useState(initialVideos);
  const [nextPageToken, setNextPageToken] = useState(initialNextPageToken);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (!nextPageToken || loadingMore) return;

    setLoadingMore(true);
    setErrorMsg(null);

    try {
      const params = new URLSearchParams({
        playlistId,
        pageToken: nextPageToken,
      });
      const res = await fetch('/api/playlist-videos?' + params.toString());

      if (!res.ok) {
        throw new Error('Playlist videos request failed');
      }

      const data: PlaylistVideosResponse = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setVideos((current) => {
        const seen = new Set(current.map((video) => video.videoId));
        const freshVideos = data.videos.filter((video) => {
          if (seen.has(video.videoId)) return false;
          seen.add(video.videoId);
          return true;
        });

        return [...current, ...freshVideos];
      });
      setNextPageToken(data.nextPageToken);
    } catch (error) {
      console.warn(error);
      setErrorMsg('영상을 더 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextPageToken, playlistId]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !nextPageToken) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '400px 0px' }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, nextPageToken]);

  if (videos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-8 text-center text-sm text-zinc-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
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

      <div ref={loadMoreRef} className="min-h-8">
        {loadingMore && (
          <p className="py-2 text-center text-zinc-400">더 불러오는 중...</p>
        )}
        {errorMsg && <p className="py-2 text-center text-red-400">{errorMsg}</p>}
        {!loadingMore && !nextPageToken && (
          <p className="py-2 text-center text-zinc-500">
            마지막 영상입니다.
          </p>
        )}
      </div>
    </div>
  );
}
