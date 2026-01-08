import { NextResponse } from 'next/server';

const BASE_URL = 'https://www.jiosaavn.com/api.php';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    try {
        const apiUrl = new URL(BASE_URL);
        apiUrl.searchParams.append('__call', 'lyrics.getLyrics');
        apiUrl.searchParams.append('_format', 'json');
        apiUrl.searchParams.append('ctx', 'wap6dot0');
        apiUrl.searchParams.append('lyrics_id', id);

        console.log(`Fetching lyrics for ID: ${id}`);

        const response = await fetch(apiUrl.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch lyrics: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching lyrics:', error);
        return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 502 });
    }
}
