/**
 * App Data Viewer Page
 * Route: /apps/[app-id]
 */

import { getApp } from '@/lib/data/api';
import { SlidingWindowTable } from '@/components/data-table/sliding-window-table';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function AppPage({
    params,
}: {
    params: Promise<{ 'app-id': string }>;
}) {
    const { 'app-id': appId } = await params;

    const app = await getApp(appId);

    if (!app) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b shadow-sm sticky top-0 z-20">
                <div className="max-w-[1600px] mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link
                                href={`/tenants/${app.tenantId}`}
                                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                            >
                                ← Back to Apps
                            </Link>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl">{app.icon}</span>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">{app.name}</h1>
                                    <p className="text-sm text-gray-500">{app.description}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-6">
                            <div className="text-right">
                                <div className="text-xs text-gray-500">Total Records</div>
                                <div className="text-lg font-bold text-blue-600">
                                    {app.recordCount.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500">Created</div>
                                <div className="text-sm font-medium text-gray-700">
                                    {new Date(app.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="min-w-[500px] lg:min-w-[1400px] w-fit max-w-[1400px] mx-auto px-6 py-8">
                {/* Data Table */}
                <div className="bg-white rounded-lg shadow border overflow-hidden">
                    <SlidingWindowTable appId={appId} />
                </div>
            </main>
        </div>
    );
}
