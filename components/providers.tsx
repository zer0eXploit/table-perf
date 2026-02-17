/**
 * React Query Provider Wrapper
 * Wraps the application to enable @tanstack/react-query hooks
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Prevent refetching on window focus for better performance
                        refetchOnWindowFocus: false,
                        // Keep data fresh for 30 seconds
                        staleTime: 30000,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
