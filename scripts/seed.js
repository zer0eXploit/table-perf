#!/usr/bin/env node

/**
 * Seed Script for Multi-Tenant Data Viewer
 * Generates mock data for tenants, apps, and a large dataset (50,000 records)
 */

const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Configuration
const NUM_TENANTS = 5;
const NUM_APPS_PER_TENANT = 3;
const NUM_RECORDS = 50000; // 50k records for testing sliding window

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('🌱 Generating seed data...\n');

// Generate Tenants
console.log(`📦 Generating ${NUM_TENANTS} tenants...`);
const tenants = [];
for (let i = 1; i <= NUM_TENANTS; i++) {
  tenants.push({
    id: `tenant_${i}`,
    name: faker.company.name(),
    subdomain: faker.internet.domainWord(),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    totalApps: NUM_APPS_PER_TENANT,
  });
}
fs.writeFileSync(
  path.join(dataDir, 'tenants.json'),
  JSON.stringify(tenants, null, 2)
);
console.log(`✅ Created tenants.json with ${tenants.length} tenants\n`);

// Generate Apps
console.log(`📱 Generating ${NUM_TENANTS * NUM_APPS_PER_TENANT} apps...`);
const apps = [];
let appCounter = 1;
for (const tenant of tenants) {
  for (let j = 1; j <= NUM_APPS_PER_TENANT; j++) {
    apps.push({
      id: `app_${appCounter}`,
      tenantId: tenant.id,
      name: `${faker.commerce.productName()} ${faker.word.noun()}`,
      description: faker.company.catchPhrase(),
      icon: faker.internet.emoji(),
      recordCount: appCounter === 1 ? NUM_RECORDS : faker.number.int({ min: 100, max: 5000 }),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    });
    appCounter++;
  }
}
fs.writeFileSync(
  path.join(dataDir, 'apps.json'),
  JSON.stringify(apps, null, 2)
);
console.log(`✅ Created apps.json with ${apps.length} apps\n`);

// Generate Large Dataset for app_1 (the main POC dataset)
console.log(`📊 Generating ${NUM_RECORDS.toLocaleString()} records for app_1...`);
console.log('⏳ This may take a moment...');

const statuses = ['Active', 'Inactive', 'Pending', 'Suspended'];
const largeDataset = [];

const startTime = Date.now();
for (let i = 1; i <= NUM_RECORDS; i++) {
  largeDataset.push({
    id: i,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    jobTitle: faker.person.jobTitle(),
    company: faker.company.name(),
    status: faker.helpers.arrayElement(statuses),
    createdAt: faker.date.past({ years: 3 }).toISOString(),
  });

  // Progress indicator
  if (i % 5000 === 0) {
    console.log(`   Generated ${i.toLocaleString()} / ${NUM_RECORDS.toLocaleString()} records...`);
  }
}

fs.writeFileSync(
  path.join(dataDir, 'app_1_data.json'),
  JSON.stringify(largeDataset, null, 2)
);

const endTime = Date.now();
const elapsed = ((endTime - startTime) / 1000).toFixed(2);

console.log(`✅ Created app_1_data.json with ${NUM_RECORDS.toLocaleString()} records in ${elapsed}s\n`);

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✨ Seed data generation complete!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📁 Data directory: ${dataDir}`);
console.log(`   - tenants.json (${tenants.length} records)`);
console.log(`   - apps.json (${apps.length} records)`);
console.log(`   - app_1_data.json (${NUM_RECORDS.toLocaleString()} records)`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('💡 Tip: app_1 is configured for 50k records to test sliding window performance');
console.log('');
