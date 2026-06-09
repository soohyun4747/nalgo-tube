const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

type YouTubeSearchItem = {
	id: { videoId?: string; channelId?: string };
	snippet: {
		title: string;
		description?: string;
		thumbnails?: YouTubeThumbnails;
		channelTitle: string;
		publishedAt: string;
	};
};

type YouTubeThumbnails = {
	high?: { url: string };
	medium?: { url: string };
	default?: { url: string };
};

type YouTubeVideoItem = {
	id: string;
	snippet: {
		title: string;
		description: string;
		channelTitle: string;
		publishedAt: string;
	};
	contentDetails?: {
		duration?: string;
	};
};

type YouTubeChannelItem = {
	id: string;
	snippet: {
		title: string;
		description: string;
		thumbnails?: YouTubeThumbnails;
	};
	contentDetails?: {
		relatedPlaylists?: {
			uploads?: string;
		};
	};
};

type YouTubePlaylistItem = {
	id: string;
	snippet: {
		title: string;
		description: string;
		thumbnails?: YouTubeThumbnails;
		publishedAt: string;
	};
	contentDetails?: {
		itemCount?: number;
	};
};

type YouTubePlaylistVideoItem = {
	id: string;
	snippet: {
		title: string;
		description: string;
		thumbnails?: YouTubeThumbnails;
		channelTitle: string;
		publishedAt: string;
		resourceId?: {
			videoId?: string;
		};
	};
};

type SearchVideo = {
	kind?: 'video';
	videoId: string;
	title: string;
	thumbnailUrl: string;
	channelTitle: string;
	publishedAt: string;
};

type VideoDetail = {
	title: string;
	description: string;
	channelTitle: string;
	publishedAt: string;
};

type ChannelDetail = {
	channelId: string;
	title: string;
	description: string;
	thumbnailUrl: string;
	uploadsPlaylistId: string | null;
};

export type PlaylistDetail = {
	playlistId: string;
	title: string;
	description: string;
	thumbnailUrl: string;
	publishedAt: string;
	itemCount: number;
};

export type PlaylistVideosPage = {
	videos: SearchVideo[];
	nextPageToken: string | null;
};

export type VideoSearchResult = SearchVideo & {
	kind: 'video';
};

export type ChannelSearchResult = {
	kind: 'channel';
	channelId: string;
	title: string;
	description: string;
	thumbnailUrl: string;
};

export type YouTubeSearchResult = VideoSearchResult | ChannelSearchResult;

export type YouTubeSearchResponse = {
	results: YouTubeSearchResult[];
	nextPageToken: string | null;
};

function getApiKey() {
	const apiKey =
		process.env.YOUTUBE_API_KEY ?? process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

	if (!apiKey) {
		throw new Error('YouTube API key is not set in environment variables');
	}

	return apiKey;
}

function buildUrl(path: string, params: Record<string, string>): string {
	const normalizedPath = path.replace(/^\/+/, '');
	const url = new URL(`${YOUTUBE_API_BASE}/${normalizedPath}`);

	Object.entries(params).forEach(([key, value]) => {
		url.searchParams.set(key, value);
	});

	url.searchParams.set('key', getApiKey());

	return url.toString();
}

function getThumbnailUrl(thumbnails?: YouTubeThumbnails) {
	return (
		thumbnails?.high?.url ||
		thumbnails?.medium?.url ||
		thumbnails?.default?.url ||
		''
	);
}

function uniqueByVideoId(videos: SearchVideo[]) {
	const seen = new Set<string>();

	return videos.filter((video) => {
		if (seen.has(video.videoId)) return false;
		seen.add(video.videoId);
		return true;
	});
}

function parseDurationSeconds(duration: string) {
	const match = duration.match(
		/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
	);

	if (!match) return 0;

	const [, days = '0', hours = '0', minutes = '0', seconds = '0'] = match;

	return (
		Number(days) * 86400 +
		Number(hours) * 3600 +
		Number(minutes) * 60 +
		Number(seconds)
	);
}

function isRegularVideo(item: YouTubeVideoItem) {
	const seconds = parseDurationSeconds(item.contentDetails?.duration ?? '');
	return seconds > 60;
}

async function getRegularVideoIds(videoIds: string[]) {
	if (videoIds.length === 0) return new Set<string>();
	const regularVideoIds = new Set<string>();

	for (let i = 0; i < videoIds.length; i += 50) {
		const ids = videoIds.slice(i, i + 50);
		const url = buildUrl('/videos', {
			part: 'contentDetails',
			id: ids.join(','),
		});

		const response = await fetch(url, { cache: 'no-store' });

		if (!response.ok) {
			throw new Error(
				`YouTube videos request failed with status ${response.status}`
			);
		}

		const data: { items?: YouTubeVideoItem[] } = await response.json();

		for (const item of data.items ?? []) {
			if (isRegularVideo(item)) {
				regularVideoIds.add(item.id);
			}
		}
	}

	return regularVideoIds;
}

export async function searchVideos(q: string): Promise<SearchVideo[]> {
	const url = buildUrl('/search', {
		part: 'snippet',
		type: 'video',
		maxResults: '25',
		q,
	});

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(
			`YouTube search request failed with status ${response.status}`
		);
	}

	const data: { items?: YouTubeSearchItem[] } = await response.json();
	const items = data.items ?? [];
	const videoIds = items
		.map((item) => item.id.videoId)
		.filter((videoId): videoId is string => Boolean(videoId));
	const regularVideoIds = await getRegularVideoIds(videoIds);

	return items
		.filter(
			(item): item is YouTubeSearchItem & { id: { videoId: string } } =>
				Boolean(item.id.videoId && regularVideoIds.has(item.id.videoId))
		)
		.map((item) => {
			const {
				id: { videoId },
				snippet: { title, thumbnails, channelTitle, publishedAt },
			} = item;

			return {
				kind: 'video',
				videoId,
				title,
				thumbnailUrl: getThumbnailUrl(thumbnails),
				channelTitle,
				publishedAt,
			};
		});
}

export async function searchYouTube(
	q: string,
	pageToken?: string | null
): Promise<YouTubeSearchResponse> {
	const params: Record<string, string> = {
		part: 'snippet',
		type: 'video,channel',
		maxResults: '12',
		q,
	};

	if (pageToken) {
		params.pageToken = pageToken;
	}

	const url = buildUrl('/search', params);
	const response = await fetch(url, { cache: 'no-store' });

	if (!response.ok) {
		throw new Error(
			`YouTube search request failed with status ${response.status}`
		);
	}

	const data: { items?: YouTubeSearchItem[]; nextPageToken?: string } =
		await response.json();
	const items = data.items ?? [];
	const videoIds = items
		.map((item) => item.id.videoId)
		.filter((videoId): videoId is string => Boolean(videoId));
	const regularVideoIds = await getRegularVideoIds(videoIds);

	const results = items
		.map((item): YouTubeSearchResult | null => {
			const { id, snippet } = item;

			if (id.channelId) {
				return {
					kind: 'channel',
					channelId: id.channelId,
					title: snippet.title,
					description: snippet.description ?? '',
					thumbnailUrl: getThumbnailUrl(snippet.thumbnails),
				};
			}

			if (id.videoId && regularVideoIds.has(id.videoId)) {
				return {
					kind: 'video',
					videoId: id.videoId,
					title: snippet.title,
					thumbnailUrl: getThumbnailUrl(snippet.thumbnails),
					channelTitle: snippet.channelTitle,
					publishedAt: snippet.publishedAt,
				};
			}

			return null;
		})
		.filter((result): result is YouTubeSearchResult => Boolean(result));

	return {
		results,
		nextPageToken: data.nextPageToken ?? null,
	};
}

export async function getVideoDetail(id: string): Promise<VideoDetail | null> {
	const trimmedId = id.trim();

	const url = buildUrl('/videos', {
		part: 'snippet',
		id: trimmedId,
	});

	const response = await fetch(url, { cache: 'no-store' });

	if (response.status === 404) {
		return null;
	}

	if (!response.ok) {
		const body = await response.text().catch(() => '');
		console.error('YouTube detail error:', response.status, body);
		throw new Error(
			`YouTube video detail request failed with status ${response.status}`
		);
	}

	const data: { items?: YouTubeVideoItem[] } = await response.json();

	if (!data.items || data.items.length === 0) {
		return null;
	}

	const { snippet } = data.items[0];

	return {
		title: snippet.title,
		description: snippet.description,
		channelTitle: snippet.channelTitle,
		publishedAt: snippet.publishedAt,
	};
}

export async function getChannelDetail(
	channelId: string
): Promise<ChannelDetail | null> {
	const url = buildUrl('/channels', {
		part: 'snippet,contentDetails',
		id: channelId.trim(),
	});

	const response = await fetch(url, { cache: 'no-store' });

	if (!response.ok) {
		throw new Error(
			`YouTube channel request failed with status ${response.status}`
		);
	}

	const data: { items?: YouTubeChannelItem[] } = await response.json();
	const item = data.items?.[0];

	if (!item) return null;

	return {
		channelId: item.id,
		title: item.snippet.title,
		description: item.snippet.description,
		thumbnailUrl: getThumbnailUrl(item.snippet.thumbnails),
		uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads ?? null,
	};
}

export async function getChannelPlaylists(
	channelId: string
): Promise<PlaylistDetail[]> {
	const playlists: PlaylistDetail[] = [];
	let pageToken: string | undefined;

	do {
		const params: Record<string, string> = {
			part: 'snippet,contentDetails',
			channelId: channelId.trim(),
			maxResults: '50',
		};

		if (pageToken) {
			params.pageToken = pageToken;
		}

		const url = buildUrl('/playlists', params);
		const response = await fetch(url, { cache: 'no-store' });

		if (!response.ok) {
			throw new Error(
				`YouTube playlists request failed with status ${response.status}`
			);
		}

		const data: {
			items?: YouTubePlaylistItem[];
			nextPageToken?: string;
		} = await response.json();

		for (const item of data.items ?? []) {
			playlists.push({
				playlistId: item.id,
				title: item.snippet.title,
				description: item.snippet.description,
				thumbnailUrl: getThumbnailUrl(item.snippet.thumbnails),
				publishedAt: item.snippet.publishedAt,
				itemCount: item.contentDetails?.itemCount ?? 0,
			});
		}

		pageToken = data.nextPageToken;
	} while (pageToken);

	return playlists;
}

export async function getPlaylistVideos(
	playlistId: string
): Promise<SearchVideo[]> {
	const videos: SearchVideo[] = [];
	let pageToken: string | undefined;

	do {
		const page = await getPlaylistVideosPage(playlistId, pageToken);
		videos.push(...page.videos);
		pageToken = page.nextPageToken ?? undefined;
	} while (pageToken);

	return uniqueByVideoId(videos);
}

export async function getPlaylistVideosPage(
	playlistId: string,
	pageToken?: string | null
): Promise<PlaylistVideosPage> {
	const params: Record<string, string> = {
		part: 'snippet',
		playlistId: playlistId.trim(),
		maxResults: '50',
	};

	if (pageToken) {
		params.pageToken = pageToken;
	}

	const url = buildUrl('/playlistItems', params);
	const response = await fetch(url, { cache: 'no-store' });

	if (!response.ok) {
		throw new Error(
			`YouTube playlist items request failed with status ${response.status}`
		);
	}

	const data: {
		items?: YouTubePlaylistVideoItem[];
		nextPageToken?: string;
	} = await response.json();
	const videos: SearchVideo[] = [];

	for (const item of data.items ?? []) {
		const videoId = item.snippet.resourceId?.videoId;

		if (!videoId || item.snippet.title === 'Deleted video') {
			continue;
		}

		videos.push({
			kind: 'video',
			videoId,
			title: item.snippet.title,
			thumbnailUrl: getThumbnailUrl(item.snippet.thumbnails),
			channelTitle: item.snippet.channelTitle,
			publishedAt: item.snippet.publishedAt,
		});
	}

	const regularVideoIds = await getRegularVideoIds(
		videos.map((video) => video.videoId)
	);

	return {
		videos: uniqueByVideoId(
			videos.filter((video) => regularVideoIds.has(video.videoId))
		),
		nextPageToken: data.nextPageToken ?? null,
	};
}

export async function getPlaylistDetail(
	playlistId: string
): Promise<PlaylistDetail | null> {
	const url = buildUrl('/playlists', {
		part: 'snippet,contentDetails',
		id: playlistId.trim(),
	});

	const response = await fetch(url, { cache: 'no-store' });

	if (!response.ok) {
		throw new Error(
			`YouTube playlist request failed with status ${response.status}`
		);
	}

	const data: { items?: YouTubePlaylistItem[] } = await response.json();
	const item = data.items?.[0];

	if (!item) return null;

	return {
		playlistId: item.id,
		title: item.snippet.title,
		description: item.snippet.description,
		thumbnailUrl: getThumbnailUrl(item.snippet.thumbnails),
		publishedAt: item.snippet.publishedAt,
		itemCount: item.contentDetails?.itemCount ?? 0,
	};
}

export async function getChannelVideos(channelId: string): Promise<SearchVideo[]> {
	const channel = await getChannelDetail(channelId);

	if (!channel?.uploadsPlaylistId) {
		return [];
	}

	return getPlaylistVideos(channel.uploadsPlaylistId);
}
