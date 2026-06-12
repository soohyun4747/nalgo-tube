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
	pageToken?: string | null,
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

	const [queryInput, setQueryInput] = useState(trimmedQuery);
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [nextPageToken, setNextPageToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const hasQuery = useMemo(() => trimmedQuery.length > 0, [trimmedQuery]);
	useEffect(() => {
		setQueryInput(trimmedQuery);
	}, [trimmedQuery]);

	const loadMore = useCallback(async () => {
		if (!hasQuery || !nextPageToken || loading || loadingMore) return;

		setLoadingMore(true);
		setErrorMsg(null);

		try {
			const { results, nextPageToken: newNextPageToken } =
				await searchClient(trimmedQuery, nextPageToken);

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
			{ rootMargin: '400px 0px' },
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

	const clearSearch = () => {
		setQueryInput('');
		router.push('/');
	};

	return (
		<main className='flex min-h-screen flex-col items-center bg-white md:px-6 md:py-10 text-slate-950'>
			<div className='w-full max-w-4xl space-y-8 md:rounded-2xl md:border border-slate-200 bg-white px-6 py-8 md:shadow-lg shadow-slate-200/70'>
				<div className='w-full flex justify-center'>
					<div className='text-center flex flex-center items-center gap-1'>
						<img
							alt='logo'
							src='/logo.svg'
							className='size-10'
						/>
						<h1 className='text-2xl font-bold text-slate-950'>
							No More Tube
						</h1>
					</div>
				</div>

				<form
					className='flex gap-3'
					onSubmit={(e) => {
						e.preventDefault();
						const formData = new FormData(e.currentTarget);
						handleSubmit(formData);
					}}>
					<label
						className='sr-only'
						htmlFor='search'>
						검색어
					</label>
					<div className='relative w-full'>
						<input
							id='search'
							name='q'
							value={queryInput}
							onChange={(event) =>
								setQueryInput(event.target.value)
							}
							placeholder='키워드를 입력하세요'
							className='w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-950 outline-none ring-blue-200 placeholder:text-slate-400 focus:ring-2'
						/>
						{queryInput && (
							<button
								type='button'
								aria-label='검색어 지우기'
								onClick={clearSearch}
								className='absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-lg font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200'>
								×
							</button>
						)}
					</div>
					<button
						type='submit'
						className='min-w-20 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200'>
						검색
					</button>
				</form>

				<section className='rounded-lg md:border border-dashed border-slate-300 md:bg-slate-50 md:px-4 md:py-6 text-sm text-slate-700'>
					{loading && (
						<p className='text-center text-slate-500'>검색 중...</p>
					)}

					{!loading && errorMsg && (
						<p className='text-center text-red-600'>{errorMsg}</p>
					)}

					{!loading && !errorMsg && hasQuery ? (
						searchResults.length > 0 ? (
							<div className='space-y-4'>
								{/* <div className='space-y-1'>
									<p className='text-xs uppercase tracking-widest text-blue-600'>
										검색 결과
									</p>
									<p className='text-lg font-semibold text-slate-950'>
										&quot;{trimmedQuery}&quot;
									</p>
								</div> */}

								<ul className='space-y-4'>
									{searchResults.map((result) => (
										<li
											key={resultKey(result)}
											className={
												result.kind === 'channel'
													? 'overflow-hidden rounded-lg border border-blue-200 bg-blue-50'
													: 'overflow-hidden rounded-lg border border-slate-200 bg-white'
											}>
											{result.kind === 'channel' ? (
												<Link
													href={`/channel/${result.channelId}`}
													className='flex flex-col gap-4 p-4 transition hover:bg-blue-100 sm:flex-row sm:items-center'>
													<div className='h-24 w-24 shrink-0 overflow-hidden rounded-full border border-blue-200 bg-slate-100'>
														{result.thumbnailUrl ? (
															<img
																src={
																	result.thumbnailUrl
																}
																alt={
																	result.title
																}
																className='h-full w-full object-cover'
																loading='lazy'
															/>
														) : (
															<div className='flex h-full items-center justify-center text-xs text-slate-500'>
																채널
															</div>
														)}
													</div>

													<div className='flex flex-1 flex-col gap-2'>
														<span className='w-fit rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white'>
															채널
														</span>
														<h2 className='text-lg font-semibold text-slate-950 line-clamp-2'>
															{he.decode(
																result.title,
															)}
														</h2>
														{result.description && (
															<p className='text-sm leading-6 text-slate-600 line-clamp-2'>
																{he.decode(
																	result.description,
																)}
															</p>
														)}
													</div>
												</Link>
											) : (
												<Link
													href={`/watch/${result.videoId}`}
													className='flex flex-col gap-4 p-4 transition hover:bg-slate-50 sm:flex-row'>
													<div className='aspect-video w-full max-w-xs overflow-hidden rounded-md bg-slate-100'>
														{result.thumbnailUrl ? (
															<img
																src={
																	result.thumbnailUrl
																}
																alt={
																	result.title
																}
																className='h-full w-full object-cover'
																loading='lazy'
															/>
														) : (
															<div className='flex h-full items-center justify-center text-xs text-slate-500'>
																No Thumbnail
															</div>
														)}
													</div>

													<div className='flex flex-1 flex-col gap-2'>
														<h2 className='text-lg font-semibold text-slate-950 line-clamp-2'>
															{he.decode(
																result.title,
															)}
														</h2>
														<p className='text-sm text-slate-500'>
															{he.decode(
																result.channelTitle,
															)}
														</p>
														<p className='text-xs text-slate-400'>
															{formatDate(
																result.publishedAt,
															)}
														</p>
													</div>
												</Link>
											)}
										</li>
									))}
								</ul>

								<div
									ref={loadMoreRef}
									className='min-h-8'>
									{loadingMore && (
										<p className='py-2 text-center text-slate-500'>
											더 불러오는 중...
										</p>
									)}
									{!loadingMore && !nextPageToken && (
										<p className='py-2 text-center text-slate-400'>
											마지막 결과입니다.
										</p>
									)}
								</div>
							</div>
						) : (
							<div className='text-center text-slate-500'>
								검색 결과가 없어요.
							</div>
						)
					) : (
						!hasQuery &&
						!loading && (
							<p className='text-center text-slate-500'>
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
				<main className='flex min-h-screen flex-col items-center bg-white md:px-6 md:py-10 text-slate-950'>
					<div className='w-full max-w-4xl md:rounded-2xl md:border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500 md:shadow-lg shadow-slate-200/70'>
						검색 화면을 준비 중...
					</div>
				</main>
			}>
			<HomeContent />
		</Suspense>
	);
}
