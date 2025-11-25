const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

const apiKey = process.env.YOUTUBE_API_KEY;

if (!apiKey) {
  throw new Error("YOUTUBE_API_KEY is not set in environment variables");
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

  url.searchParams.set("key", apiKey);

  return url.toString();
}

export async function searchVideos(q: string): Promise<SearchVideo[]> {
  const url = buildUrl("/search", {
    part: "snippet",
    type: "video",
    maxResults: "25",
    q,
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`YouTube search request failed with status ${response.status}`);
  }

  const data: { items?: YouTubeSearchItem[] } = await response.json();

  if (!data.items) {
    return [];
  }

  return data.items
    .filter((item): item is YouTubeSearchItem & { id: { videoId: string } } => Boolean(item.id.videoId))
    .map((item) => {
      const {
        id: { videoId },
        snippet: { title, thumbnails, channelTitle, publishedAt },
      } = item;

      const thumbnailUrl =
        thumbnails?.high?.url ||
        thumbnails?.medium?.url ||
        thumbnails?.default?.url ||
        "";

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
  const url = buildUrl("/videos", {
    part: "snippet",
    id,
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`YouTube video detail request failed with status ${response.status}`);
  }

  const data: { items?: YouTubeVideoItem[] } = await response.json();

  const item = data.items?.[0];

  if (!item) {
    return null;
  }

  const {
    snippet: { title, description, channelTitle, publishedAt },
  } = item;

  return {
    title,
    description,
    channelTitle,
    publishedAt,
  };
}
