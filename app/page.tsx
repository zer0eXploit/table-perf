import { getTenants } from '@/lib/data/api';
import Link from 'next/link';

export default async function Home() {
  const tenants = await getTenants();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Tenants
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Select a tenant to view their applications
          </p>
          <div className="text-sm text-gray-500">
            {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'}
          </div>
        </div>

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <Link
              key={tenant.id}
              href={`/tenants/${tenant.id}`}
              className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all duration-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                    {tenant.name.charAt(0)}
                  </div>
                  <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {tenant.totalApps} {tenant.totalApps === 1 ? 'app' : 'apps'}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                  {tenant.name}
                </h3>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    @{tenant.subdomain}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
                  <span>Created {new Date(tenant.createdAt).toLocaleDateString()}</span>
                  <span className="text-indigo-600 group-hover:text-indigo-700 font-medium">
                    View apps →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
