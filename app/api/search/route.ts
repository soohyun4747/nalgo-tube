import { NextResponse } from 'next/server';
import { searchYouTube } from '@/lib/youtube';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const q = searchParams.get('q')?.trim() ?? '';
	const pageToken = searchParams.get('pageToken');

	if (!q) {
		return NextResponse.json({ results: [], nextPageToken: null });
	}

	try {
		const result = await searchYouTube(q, pageToken);
		return NextResponse.json(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Unknown search API error';
		console.warn('Search API failed:', message);

		return NextResponse.json(
			{
				error: '검색 중 오류가 발생했습니다.',
				results: [],
				nextPageToken: null,
			},
			{ status: 200 }
		);
	}
}
