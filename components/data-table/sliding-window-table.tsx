/**
 * Sliding Window Table Component
 * 
 * CRITICAL ARCHITECTURAL PATTERN:
 * This component implements a "sliding window" data fetching strategy.
 * 
 * Unlike infinite scrolling (where arrays grow indefinitely):
 * - DOM nodes remain flat (only visible + buffer rows are rendered)
 * - Memory footprint remains constant (old data is discarded when scrolling)
 * - We fetch ONLY what the user is currently viewing + a small buffer
 * 
 * How it works:
 * 1. @tanstack/react-virtual creates a massive virtual scroll container using totalCount
 * 2. We extract the visible range from getVirtualItems()
 * 3. We add a buffer (e.g., +/- 20 rows) to prevent flickering
 * 4. We fetch ONLY that specific range from the API (start + size params)
 * 5. When the user scrolls, we discard old data and fetch the new visible range
 * 
 * Table Implementation:
 * - Uses @tanstack/react-table for column management and resizing
 * - Columns use absolute positioning with getStart() for perfect alignment
 * - Resizable columns with draggable handles
 * - Sticky header at the top
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo, useState, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
    ColumnResizeMode,
} from '@tanstack/react-table';

interface DataRecord {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    company: string;
    status: string;
    createdAt: string;
}

interface SlidingWindowTableProps {
    appId: string;
}

const BUFFER_SIZE = 20; // Rows to load above/below visible area
const OVERSCAN = 5; // Additional rows for smooth scrolling
const DEBOUNCE_MS = 300; // Debounce delay for API calls during rapid scrolling
const ROW_HEIGHT = 50; // Fixed row height for virtualization

export function SlidingWindowTable({ appId }: SlidingWindowTableProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [columnResizeMode] = useState<ColumnResizeMode>('onChange');

    // Step 1: Fetch metadata to get totalCount
    const { data: metaData } = useQuery({
        queryKey: ['app-meta', appId],
        queryFn: async () => {
            const res = await fetch(`/api/apps/${appId}/data?start=0&size=1`);
            const json = await res.json();
            return { totalCount: json.totalCount };
        },
    });

    const totalCount = metaData?.totalCount || 0;

    // Step 2: Initialize the virtualizer
    const virtualizer = useVirtualizer({
        count: totalCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: OVERSCAN,
    });

    const virtualItems = virtualizer.getVirtualItems();

    // Step 3: Calculate the visible range + buffer
    const visibleRange = useMemo(() => {
        if (virtualItems.length === 0) {
            return { start: 0, size: 50 };
        }

        const firstVisibleIndex = virtualItems[0].index;
        const lastVisibleIndex = virtualItems[virtualItems.length - 1].index;

        const start = Math.max(0, firstVisibleIndex - BUFFER_SIZE);
        const end = Math.min(totalCount - 1, lastVisibleIndex + BUFFER_SIZE);
        const size = end - start + 1;

        return { start, size };
    }, [virtualItems, totalCount]);

    // Step 3.5: Debounce the visible range to prevent API spam during rapid scrolling
    const [debouncedRange, setDebouncedRange] = useState(visibleRange);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedRange(visibleRange);
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [visibleRange]);

    // Step 4: Fetch the visible range (using debounced range)
    const { data: queryData, isLoading } = useQuery({
        queryKey: ['app-data', appId, debouncedRange.start, debouncedRange.size],
        queryFn: async () => {
            const res = await fetch(
                `/api/apps/${appId}/data?start=${debouncedRange.start}&size=${debouncedRange.size}`
            );
            return res.json();
        },
        enabled: totalCount > 0,
        staleTime: 30000,
        placeholderData: (previousData) => previousData,
    });

    // Step 5: Map fetched data to absolute indexes
    const dataMap = useMemo(() => {
        if (!queryData?.data) return new Map<number, DataRecord>();

        const map = new Map<number, DataRecord>();
        queryData.data.forEach((record: DataRecord, idx: number) => {
            const absoluteIndex = debouncedRange.start + idx;
            map.set(absoluteIndex, record);
        });
        return map;
    }, [queryData, debouncedRange.start]);

    // Step 6: Define columns using TanStack Table
    const columns = useMemo<ColumnDef<DataRecord>[]>(() => {
        if (dataMap.size === 0) return [];

        const firstRecord = Array.from(dataMap.values())[0];
        const keys = Object.keys(firstRecord) as (keyof DataRecord)[];

        return keys.map((key) => ({
            accessorKey: key,
            id: key,
            header: () => (
                <div className="truncate">
                    {String(key).charAt(0).toUpperCase() + String(key).slice(1).replace(/([A-Z])/g, ' $1')}
                </div>
            ),
            cell: (info) => {
                const value = info.getValue();
                const displayValue = key === 'createdAt' && typeof value === 'string'
                    ? new Date(value).toLocaleDateString()
                    : String(value || '');
                return (
                    <div className="truncate" title={displayValue}>
                        {displayValue}
                    </div>
                );
            },
            size: key === 'id' ? 80 : key === 'email' ? 240 : key === 'jobTitle' ? 220 : key === 'company' ? 200 : 150,
            minSize: 60,
            maxSize: 500,
        }));
    }, [dataMap]);

    // Step 7: Prepare data for table (just column definitions, actual row data is virtual)
    const tableData = useMemo(() => {
        // We only need a single dummy row for the table to generate column structure
        return dataMap.size > 0 ? [Array.from(dataMap.values())[0]] : [];
    }, [dataMap]);

    // Step 8: Initialize TanStack Table
    const table = useReactTable({
        data: tableData,
        columns,
        columnResizeMode,
        getCoreRowModel: getCoreRowModel(),
        enableColumnResizing: true,
    });

    // Loading state
    if (totalCount === 0 && isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading data...</p>
                </div>
            </div>
        );
    }

    if (totalCount === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-gray-500">No data available</p>
            </div>
        );
    }

    const totalHeight = virtualizer.getTotalSize();

    return (
        <div className="w-full">
            {/* Stats Bar */}
            <div className="bg-gray-50 border-b px-4 py-2 flex items-center justify-between text-sm">
                <div className="text-gray-600">
                    Total Records: <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span>
                </div>
                <div className="text-gray-600">
                    Viewing: <span className="font-semibold text-gray-900">
                        {visibleRange.start + 1} - {Math.min(visibleRange.start + visibleRange.size, totalCount)}
                    </span>
                </div>
            </div>

            {/* Scrollable Container */}
            <div
                ref={parentRef}
                className="overflow-auto bg-white relative"
                style={{ height: '600px', width: '100%' }}
            >
                {/* Table Container */}
                <div style={{ width: table.getTotalSize() }}>
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-10 bg-gray-50 border-b shadow-sm" style={{ height: `${ROW_HEIGHT}px` }}>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <div
                                key={headerGroup.id}
                                className="relative"
                                style={{ height: `${ROW_HEIGHT}px` }}
                            >
                                {headerGroup.headers.map((header) => (
                                    <div
                                        key={header.id}
                                        className="absolute px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50 border-r last:border-r-0"
                                        style={{
                                            left: header.getStart(),
                                            width: header.getSize(),
                                            height: `${ROW_HEIGHT}px`,
                                        }}
                                    >
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                        {/* Resize Handle */}
                                        <div
                                            onMouseDown={header.getResizeHandler()}
                                            onTouchStart={header.getResizeHandler()}
                                            className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-500 ${header.column.getIsResizing() ? 'bg-blue-500' : ''
                                                }`}
                                            style={{
                                                transform:
                                                    columnResizeMode === 'onEnd' &&
                                                        header.column.getIsResizing()
                                                        ? `translateX(${table.getState().columnSizingInfo.deltaOffset ?? 0
                                                        }px)`
                                                        : '',
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Virtual Container for Rows */}
                    <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
                        {virtualItems.map((virtualRow) => {
                            const record = dataMap.get(virtualRow.index);
                            const isLoaderRow = !record;

                            return (
                                <div
                                    key={virtualRow.key}
                                    className={`absolute left-0 border-b ${!isLoaderRow ? 'hover:bg-gray-50' : ''
                                        } transition-colors bg-white`}
                                    style={{
                                        width: table.getTotalSize(),
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    {isLoaderRow ? (
                                        // Skeleton loader
                                        <>
                                            {table.getAllColumns().map((column) => (
                                                <div
                                                    key={column.id}
                                                    className="absolute px-4 py-3 border-r last:border-r-0 flex items-center"
                                                    style={{
                                                        left: column.getStart(),
                                                        width: column.getSize(),
                                                        height: `${ROW_HEIGHT}px`,
                                                    }}
                                                >
                                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        // Actual data row
                                        <>
                                            {table.getAllColumns().map((column) => {
                                                const value = record[column.id as keyof DataRecord];
                                                const displayValue = column.id === 'createdAt' && typeof value === 'string'
                                                    ? new Date(value).toLocaleDateString()
                                                    : String(value || '');

                                                return (
                                                    <div
                                                        key={column.id}
                                                        className="absolute px-4 py-3 text-sm text-gray-900 border-r last:border-r-0 flex items-center"
                                                        style={{
                                                            left: column.getStart(),
                                                            width: column.getSize(),
                                                            height: `${ROW_HEIGHT}px`,
                                                        }}
                                                        title={displayValue}
                                                    >
                                                        <div className="truncate">{displayValue}</div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
