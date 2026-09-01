import { fetchLiveKSE100Summary } from './src/services/livePsxScraper.js';

async function run() {
  const data = await fetchLiveKSE100Summary();
  console.log('fetchLiveKSE100Summary() output:', data);
}

run();
