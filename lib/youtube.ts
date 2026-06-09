const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

if (!apiKey) {
	throw new Error('YOUTUBE_API_KEY is not set in environment variables');
}

type YouTubeSearchItem = {
	id: { videoId?: string };
	snippet: {
		title: string;
		thumbnails?: {
			high?: { url: string };
			medium?: { url: string };
			default?: { url: string };
		};
		channelTitle: string;
		publishedAt: string;
	};
};

type YouTubeVideoItem = {
	id: string;
	snippet: {
		title: string;
		description: string;
		channelTitle: string;
		publishedAt: string;
	};
};

type SearchVideo = {
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

function buildUrl(path: string, params: Record<string, string>): string {
	const url = new URL(path, YOUTUBE_API_BASE);

	Object.entries(params).forEach(([key, value]) => {
		url.searchParams.set(key, value);
	});

	url.searchParams.set('key', apiKey!);

	return url.toString();
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

	if (!data.items) {
		return [];
	}

	return data.items
		.filter(
			(item): item is YouTubeSearchItem & { id: { videoId: string } } =>
				Boolean(item.id.videoId)
		)
		.map((item) => {
			const {
				id: { videoId },
				snippet: { title, thumbnails, channelTitle, publishedAt },
			} = item;

			const thumbnailUrl =
				thumbnails?.high?.url ||
				thumbnails?.medium?.url ||
				thumbnails?.default?.url ||
				'';

			return {
				videoId,
				title,
				thumbnailUrl,
				channelTitle,
				publishedAt,
			};
		});
}

export async function getVideoDetail(id: string): Promise<VideoDetail | null> {
	const trimmedId = id.trim(); // 혹시 공백 섞였을 가능성 제거

	const params = new URLSearchParams({
		part: 'snippet',
		id: trimmedId,
		key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY!, // 지금은 이걸 쓰신다고 했으니 그대로 둡니다
	});

	const url = `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`;

	console.log('YouTube detail URL:', url); // 🔍 실제로 어떤 URL로 요청하는지 콘솔에 출력

	const response = await fetch(url, { cache: 'no-store' });

	if (response.status === 404) {
		console.warn('Video not found (HTTP 404 from YouTube):', trimmedId);
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
		console.warn('Video items empty:', trimmedId, JSON.stringify(data));
		return null;
	}

	const item = data.items[0];
	const { snippet } = item;

	return {
		title: snippet.title,
		description: snippet.description,
		channelTitle: snippet.channelTitle,
		publishedAt: snippet.publishedAt,
	};
}
