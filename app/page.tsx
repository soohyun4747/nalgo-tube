'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import he from 'he';

type VideoResult = {
  kind: 'video';
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  channelTitle: string;
  publishedAt: string;
};

type ChannelResult = {
  kind: 'channel';
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
};

type SearchResult = VideoResult | ChannelResult;

type SearchResponse = {
  results: SearchResult[];
  nextPageToken: string | null;
  error?: string;
};

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async function searchClient(
  query: string,
  pageToken?: string | null
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
  });

  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  const res = await fetch('/api/search?' + params.toString());

  if (!res.ok) {
    throw new Error('Search request failed');
  }

  const data: SearchResponse = await res.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

function resultKey(result: SearchResult) {
  return result.kind === 'video'
    ? `video-${result.videoId}`
    : `channel-${result.channelId}`;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const rawQuery = searchParams.get('q') ?? '';
  const trimmedQuery = rawQuery.trim();

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasQuery = useMemo(() => trimmedQuery.length > 0, [trimmedQuery]);
  const videoCount = searchResults.filter(
    (result) => result.kind === 'video'
  ).length;

  const loadMore = useCallback(async () => {
    if (!hasQuery || !nextPageToken || loading || loadingMore) return;

    setLoadingMore(true);
    setErrorMsg(null);

    try {
      const { results, nextPageToken: newNextPageToken } = await searchClient(
        trimmedQuery,
        nextPageToken
      );

      setSearchResults((current) => {
        const seen = new Set(current.map(resultKey));
        const freshResults = results.filter((result) => {
          const key = resultKey(result);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return [...current, ...freshResults];
      });
      setNextPageToken(newNextPageToken);
    } catch (err) {
      console.warn(err);
      setErrorMsg('더 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingMore(false);
    }
  }, [hasQuery, loading, loadingMore, nextPageToken, trimmedQuery]);

  useEffect(() => {
    if (!hasQuery) {
      setSearchResults([]);
      setNextPageToken(null);
      setErrorMsg(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);
    setNextPageToken(null);

    searchClient(trimmedQuery)
      .then(({ results, nextPageToken: newNextPageToken }) => {
        if (cancelled) return;
        setSearchResults(results);
        setNextPageToken(newNextPageToken);
      })
      .catch((err) => {
        console.warn(err);
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

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasQuery || !nextPageToken) return;

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
  }, [hasQuery, loadMore, nextPageToken]);

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
        </div>

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
            className="min-w-20 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
          >
            검색
          </button>
        </form>

        <section className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-6 text-sm text-zinc-200">
          {loading && <p className="text-center text-zinc-400">검색 중...</p>}

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
                    &quot;{trimmedQuery}&quot;
                  </p>
                  <p className="text-sm text-zinc-400">
                    릴스를 제외한 영상 {videoCount}개와 채널을 찾았어요.
                  </p>
                </div>

                <ul className="space-y-4">
                  {searchResults.map((result) => (
                    <li
                      key={resultKey(result)}
                      className={
                        result.kind === 'channel'
                          ? 'overflow-hidden rounded-lg border border-emerald-900/70 bg-emerald-950/25'
                          : 'overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950'
                      }
                    >
                      {result.kind === 'channel' ? (
                        <Link
                          href={`/channel/${result.channelId}`}
                          className="flex flex-col gap-4 p-4 transition hover:bg-emerald-950/40 sm:flex-row sm:items-center"
                        >
                          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-emerald-800 bg-zinc-900">
                            {result.thumbnailUrl ? (
                              <img
                                src={result.thumbnailUrl}
                                alt={result.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                                채널
                              </div>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col gap-2">
                            <span className="w-fit rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-zinc-950">
                              채널
                            </span>
                            <h2 className="text-lg font-semibold text-zinc-50 line-clamp-2">
                              {he.decode(result.title)}
                            </h2>
                            {result.description && (
                              <p className="text-sm leading-6 text-zinc-300 line-clamp-2">
                                {he.decode(result.description)}
                              </p>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <Link
                          href={`/watch/${result.videoId}`}
                          className="flex flex-col gap-4 p-4 transition hover:bg-zinc-900/70 sm:flex-row"
                        >
                          <div className="aspect-video w-full max-w-xs overflow-hidden rounded-md bg-zinc-900">
                            {result.thumbnailUrl ? (
                              <img
                                src={result.thumbnailUrl}
                                alt={result.title}
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
                              {he.decode(result.title)}
                            </h2>
                            <p className="text-sm text-zinc-400">
                              {he.decode(result.channelTitle)}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {formatDate(result.publishedAt)}
                            </p>
                          </div>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>

                <div ref={loadMoreRef} className="min-h-8">
                  {loadingMore && (
                    <p className="py-2 text-center text-zinc-400">
                      더 불러오는 중...
                    </p>
                  )}
                  {!loadingMore && !nextPageToken && (
                    <p className="py-2 text-center text-zinc-500">
                      마지막 결과입니다.
                    </p>
                  )}
                </div>
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

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center bg-zinc-950 px-6 py-10 text-zinc-50">
          <div className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-8 text-center text-sm text-zinc-400 shadow-lg">
            검색 화면을 준비 중...
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
