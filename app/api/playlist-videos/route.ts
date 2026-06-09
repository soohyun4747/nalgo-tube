import { NextResponse } from 'next/server';
import { getPlaylistVideosPage } from '@/lib/youtube';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const playlistId = searchParams.get('playlistId')?.trim() ?? '';
	const pageToken = searchParams.get('pageToken');

	if (!playlistId) {
		return NextResponse.json({ videos: [], nextPageToken: null });
	}

	try {
		const result = await getPlaylistVideosPage(playlistId, pageToken);
		return NextResponse.json(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Unknown playlist API error';
		console.warn('Playlist videos API failed:', message);

		return NextResponse.json(
			{
				error: '영상을 불러오는 중 오류가 발생했습니다.',
				videos: [],
				nextPageToken: null,
			},
			{ status: 200 }
		);
	}
}
