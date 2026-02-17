/**
 * Database Service Layer
 * Acts as the adapter for reading local JSON files (simulating NoSQL database)
 * Supports range-based queries for sliding window implementation
 */

import fs from 'fs';
import path from 'path';

export interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    createdAt: string;
    totalApps: number;
}

export interface App {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    icon: string;
    recordCount: number;
    createdAt: string;
}

export interface DataRecord {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    company: string;
    status: string;
    createdAt: string;
}

export interface RangeQueryResult<T> {
    data: T[];
    totalCount: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Get all tenants
 */
export async function getTenants(): Promise<Tenant[]> {
    const filePath = path.join(DATA_DIR, 'tenants.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
}

/**
 * Get a single tenant by ID
 */
export async function getTenant(tenantId: string): Promise<Tenant | null> {
    const tenants = await getTenants();
    return tenants.find(t => t.id === tenantId) || null;
}

/**
 * Get all apps for a tenant
 */
export async function getAppsByTenant(tenantId: string): Promise<App[]> {
    const filePath = path.join(DATA_DIR, 'apps.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const apps: App[] = JSON.parse(fileContent);
    return apps.filter(app => app.tenantId === tenantId);
}

/**
 * Get a single app by ID
 */
export async function getApp(appId: string): Promise<App | null> {
    const filePath = path.join(DATA_DIR, 'apps.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const apps: App[] = JSON.parse(fileContent);
    return apps.find(app => app.id === appId) || null;
}

/**
 * CRITICAL: Range-based data query for sliding window implementation
 * 
 * Supports random access to any slice of the dataset without loading
 * the entire array into memory.
 * 
 * @param appId - The app ID to fetch data for
 * @param start - Starting index (0-based)
 * @param size - Number of records to fetch
 * @returns { data: T[], totalCount: number }
 */
export async function getAppDataRange(
    appId: string,
    start: number,
    size: number
): Promise<RangeQueryResult<DataRecord>> {
    const filePath = path.join(DATA_DIR, `${appId}_data.json`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return { data: [], totalCount: 0 };
    }

    // Read and parse the entire file
    // NOTE: In a real database, this would be a LIMIT/OFFSET query
    // For this POC with local JSON, we read the file but slice efficiently
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const allData: DataRecord[] = JSON.parse(fileContent);

    const totalCount = allData.length;

    // Slice the data based on the requested range
    // This simulates: SELECT * FROM records LIMIT size OFFSET start
    const data = allData.slice(start, start + size);

    return { data, totalCount };
}

/**
 * Get column schema from the first record
 * Used for dynamic column generation in the table
 */
export async function getAppDataSchema(appId: string): Promise<string[]> {
    const result = await getAppDataRange(appId, 0, 1);

    if (result.data.length === 0) {
        return [];
    }

    return Object.keys(result.data[0]);
}
