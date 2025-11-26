'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import he from "he";

type Video = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  channelTitle: string;
  publishedAt: string;
};

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async function searchVideosClient(query: string): Promise<Video[]> {
  if (!API_KEY) {
    console.warn('NEXT_PUBLIC_YOUTUBE_API_KEY 가 설정되지 않았습니다.');
    return [];
  }

  const params = new URLSearchParams({
    key: API_KEY,
    part: 'snippet',
    q: query,
    maxResults: '10',
    type: 'video',
  });

  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/search?' + params.toString()
  );

  if (!res.ok) {
    console.error('YouTube API error', await res.text());
    return [];
  }

  const data = await res.json();

  return (data.items ?? []).map((item: any) => ({
    videoId: item.id?.videoId ?? '',
    title: item.snippet?.title ?? '',
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? null,
    channelTitle: item.snippet?.channelTitle ?? '',
    publishedAt: item.snippet?.publishedAt ?? '',
  }));
}

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawQuery = searchParams.get('q') ?? '';
  const trimmedQuery = rawQuery.trim();

  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasQuery = useMemo(() => trimmedQuery.length > 0, [trimmedQuery]);

  useEffect(() => {
    if (!hasQuery) {
      setSearchResults([]);
      setErrorMsg(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    searchVideosClient(trimmedQuery)
      .then((videos) => {
        if (cancelled) return;
        setSearchResults(videos);
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setErrorMsg('검색 중 오류가 발생했습니다.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasQuery, trimmedQuery]);

  const handleSubmit = (formData: FormData) => {
    const q = String(formData.get('q') ?? '').trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-950 px-6 py-10 text-zinc-50">
      <div className="w-full max-w-4xl space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-8 shadow-lg">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-zinc-400">
            Nalgo Tube
          </p>
          <h1 className="text-2xl font-bold text-zinc-50">영상 검색</h1>
          <p className="text-sm text-zinc-400">
            주소창의 <code className="text-emerald-400">?q=키워드</code> 값을
            사용해 클라이언트에서 유튜브 영상을 검색합니다.
          </p>
        </div>

        {/* form은 client side로 처리 */}
        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmit(formData);
          }}
        >
          <label className="sr-only" htmlFor="search">
            검색어
          </label>
          <input
            id="search"
            name="q"
            defaultValue={trimmedQuery}
            placeholder="키워드를 입력하세요"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 outline-none ring-zinc-700 placeholder:text-zinc-600 focus:ring-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
          >
            검색
          </button>
        </form>

        <section className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-6 text-sm text-zinc-200">
          {loading && <p className="text-center text-zinc-400">검색 중…</p>}

          {!loading && errorMsg && (
            <p className="text-center text-red-400">{errorMsg}</p>
          )}

          {!loading && !errorMsg && hasQuery ? (
            searchResults.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-widest text-emerald-400">
                    검색 결과
                  </p>
                  <p className="text-lg font-semibold text-zinc-50">
                    “{trimmedQuery}”
                  </p>
                  <p className="text-sm text-zinc-400">
                    총 {searchResults.length}개의 영상을 찾았어요.
                  </p>
                </div>

                <ul className="space-y-4">
                  {searchResults.map((video) => (
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
                          <h2 className="text-lg font-semibold text-zinc-50 line-clamp-2">
                            {he.decode(video.title)}
                          </h2>
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
              </div>
            ) : (
              <div className="text-center text-zinc-400">
                검색 결과가 없어요.
              </div>
            )
          ) : (
            !hasQuery &&
            !loading && (
              <p className="text-center text-zinc-400">
                검색해서 영상을 찾아보세요.
              </p>
            )
          )}
        </section>
      </div>
    </main>
  );
}
