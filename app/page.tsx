import Link from "next/link";
import { searchVideos } from "@/lib/youtube";

interface HomeProps {
  searchParams?: {
    q?: string | string[];
  };
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function Home({ searchParams }: HomeProps) {
  const rawQuery = searchParams?.q;
  const query = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;
  const trimmedQuery = query?.trim() ?? "";
  const hasQuery = trimmedQuery.length > 0;

  const searchResults = hasQuery ? await searchVideos(trimmedQuery) : [];

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-950 px-6 py-10 text-zinc-50">
      <div className="w-full max-w-4xl space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-8 shadow-lg">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-zinc-400">Nalgo Tube</p>
          <h1 className="text-2xl font-bold text-zinc-50">영상 검색</h1>
          <p className="text-sm text-zinc-400">
            ?q=키워드 형태로 전달된 검색어를 읽어 서버 컴포넌트에서 처리합니다.
          </p>
        </div>

        <form className="flex gap-3" method="get">
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
          {hasQuery ? (
            searchResults.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-widest text-emerald-400">검색 결과</p>
                  <p className="text-lg font-semibold text-zinc-50">“{trimmedQuery}”</p>
                  <p className="text-sm text-zinc-400">총 {searchResults.length}개의 영상을 찾았어요.</p>
                </div>

                <ul className="space-y-4">
                  {searchResults.map((video) => (
                    <li key={video.videoId} className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
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
                            <div className="flex h-full items-center justify-center text-xs text-zinc-500">No Thumbnail</div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col gap-2">
                          <h2 className="text-lg font-semibold text-zinc-50 line-clamp-2">{video.title}</h2>
                          <p className="text-sm text-zinc-400">{video.channelTitle}</p>
                          <p className="text-xs text-zinc-500">{formatDate(video.publishedAt)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center text-zinc-400">검색 결과가 없어요.</div>
            )
          ) : (
            <p className="text-center text-zinc-400">검색해서 영상을 찾아보세요</p>
          )}
        </section>
      </div>
    </main>
  );
}
