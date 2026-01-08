import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const trackName = searchParams.get('track');
    const artistName = searchParams.get('artist');

    if (!trackName || !artistName) {
        return NextResponse.json({ error: 'Track and artist names required' }, { status: 400 });
    }

    try {
        const apiUrl = new URL('https://lrclib.net/api/search');
        apiUrl.searchParams.append('track_name', trackName);
        apiUrl.searchParams.append('artist_name', artistName);

        console.log(`Fetching lyrics from LRC Lib: ${trackName} - ${artistName}`);

        const response = await fetch(apiUrl.toString());

        if (!response.ok) {
            throw new Error(`Failed to fetch from LRCLib: ${response.status}`);
        }

        const data = await response.json();

        // LRCLib returns an array of results, take the first match
        if (data && data.length > 0 && data[0].plainLyrics) {
            return NextResponse.json({ lyrics: data[0].plainLyrics });
        }

        return NextResponse.json({ lyrics: null });
    } catch (error) {
        console.error('Error fetching from LRCLib:', error);
        return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 502 });
    }
}
