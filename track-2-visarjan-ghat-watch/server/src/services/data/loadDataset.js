/**
 * Dataset Loader
 * Loads the actual Bhopal ghats water quality dataset and provides summary statistics.
 */

import { importCsvFile } from './csvImport.service.js';
import { aggregateAllGhats, generateDatasetSummary } from '../analytics/evidence.service.js';
import { rankAllGhats } from '../analytics/ranking.service.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_PATH = join(__dirname, '../../../../data/bhopal_ghats_2023_2025.csv');

export async function loadBhopalDataset() {
  const result = await importCsvFile(DATA_PATH);
  return result;
}

export async function getDatasetAnalytics() {
  const { records, summary, errors, warnings } = await loadBhopalDataset();

  const datasetSummary = generateDatasetSummary(records);
  const ghatEvidence = aggregateAllGhats(records);
  const rankings = rankAllGhats(records);

  return {
    importSummary: summary,
    datasetSummary,
    ghatEvidence,
    rankings,
    errors,
    warnings
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Loading Bhopal ghats dataset...\n');

  try {
    const analytics = await getDatasetAnalytics();

    console.log('=== IMPORT SUMMARY ===');
    console.log(`Total records: ${analytics.importSummary.totalRecords}`);
    console.log(`Sites: ${analytics.importSummary.siteCount} (${analytics.importSummary.sites.join(', ')})`);
    console.log(`Parameters: ${analytics.importSummary.parameterCount}`);
    console.log(`Years: ${analytics.importSummary.years.join(', ')}`);
    console.log(`Valid numeric: ${analytics.importSummary.validNumericCount}`);
    console.log(`Missing: ${analytics.importSummary.missingCount}`);
    console.log(`BDL: ${analytics.importSummary.bdlCount}`);
    console.log(`ND: ${analytics.importSummary.ndCount}`);

    console.log('\n=== DATASET SUMMARY ===');
    console.log(`Year range: ${analytics.datasetSummary.yearRange?.start}-${analytics.datasetSummary.yearRange?.end}`);

    console.log('\n=== RANKINGS ===');
    for (const r of analytics.rankings.rankings) {
      console.log(`${r.displayName}: ${r.priority} (score: ${r.score ?? 'N/A'}, samples: ${r.validSampleCount})`);
    }

    console.log('\n=== RANKING METHODOLOGY ===');
    console.log(`Version: ${analytics.rankings.methodology.version}`);
    console.log(`Benchmarked parameters: ${analytics.rankings.methodology.parameters.join(', ')}`);

    if (analytics.errors.length > 0) {
      console.log(`\n=== ERRORS (${analytics.errors.length}) ===`);
      analytics.errors.slice(0, 5).forEach(e => console.log(`Row ${e.rowNumber}: ${JSON.stringify(e.errors)}`));
    }

    if (analytics.warnings.length > 0) {
      console.log(`\n=== WARNINGS (${analytics.warnings.length}) ===`);
      analytics.warnings.forEach(w => console.log(w.message));
    }

  } catch (err) {
    console.error('Error loading dataset:', err.message);
    process.exit(1);
  }
}
