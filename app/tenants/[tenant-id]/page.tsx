/**
 * Tenant Apps List Page
 * Route: /tenants/[tenant-id]
 */

import { getTenant, getAppsByTenant } from '@/lib/data/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function TenantPage({
    params,
}: {
    params: Promise<{ 'tenant-id': string }>;
}) {
    const { 'tenant-id': tenantId } = await params;

    const tenant = await getTenant(tenantId);

    if (!tenant) {
        notFound();
    }

    const apps = await getAppsByTenant(tenantId);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link
                                href="/"
                                className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
                            >
                                ← Back to Tenants
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
                            <p className="text-gray-500 mt-1">@{tenant.subdomain}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Applications</div>
                            <div className="text-2xl font-bold text-blue-600">{apps.length}</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Apps Grid */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {apps.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                        <p className="text-gray-500">No applications found for this tenant.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {apps.map((app) => (
                            <Link
                                key={app.id}
                                href={`/apps/${app.id}`}
                                className="group bg-white rounded-lg shadow-sm border hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="text-4xl">{app.icon}</div>
                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {app.recordCount.toLocaleString()} rows
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                                        {app.name}
                                    </h3>

                                    <p className="text-sm text-gray-600 mb-4">
                                        {app.description}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Created {new Date(app.createdAt).toLocaleDateString()}</span>
                                        <span className="text-blue-600 group-hover:text-blue-700 font-medium">
                                            View data →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

