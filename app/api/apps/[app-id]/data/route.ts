/**
 * Next.js Route Handler for App Data
 * 
 * GET /api/apps/[app-id]/data?start=0&size=50
 * 
 * Returns a slice of the dataset based on start and size query parameters.
 * This is the critical API endpoint that enables the sliding window strategy.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAppDataRange } from '@/lib/data/api';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ 'app-id': string }> }
) {
    try {
        const { 'app-id': appId } = await params;
        const searchParams = request.nextUrl.searchParams;

        // Extract query parameters
        const startParam = searchParams.get('start');
        const sizeParam = searchParams.get('size');

        // Validate parameters
        const start = startParam ? parseInt(startParam, 10) : 0;
        const size = sizeParam ? parseInt(sizeParam, 10) : 50;

        if (isNaN(start) || start < 0) {
            return NextResponse.json(
                { error: 'Invalid start parameter' },
                { status: 400 }
            );
        }

        if (isNaN(size) || size <= 0 || size > 1000) {
            return NextResponse.json(
                { error: 'Invalid size parameter (must be between 1 and 1000)' },
                { status: 400 }
            );
        }

        // Fetch data using the range-based API
        const result = await getAppDataRange(appId, start, size);

        // Return the standardized response format
        // CRITICAL: totalCount is required for virtualizer to calculate scroll height
        return NextResponse.json({
            data: result.data,
            totalCount: result.totalCount,
        });

    } catch (error) {
        console.error('Error fetching app data:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
