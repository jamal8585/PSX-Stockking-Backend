
import axios from 'axios';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

// Top prominent liquid stocks with known fundamentals
const KNOWN_BENCHMARKS = {
  'OGDC': { basePrice: 245.00, pe: 4.8, eps: 51.0, divYield: 11.2, isKse100: true },
  'PPL': { basePrice: 237.00, pe: 4.4, eps: 53.8, divYield: 9.8, isKse100: true },
  'MARI': { basePrice: 668.00, pe: 5.6, eps: 119.2, divYield: 8.5, isKse100: true },
  'POL': { basePrice: 512.00, pe: 6.2, eps: 82.5, divYield: 12.0, isKse100: true },
  'PSO': { basePrice: 360.88, pe: 4.1, eps: 88.0, divYield: 6.5, isKse100: true },
  'SNGP': { basePrice: 112.50, pe: 3.9, eps: 28.0, divYield: 8.0, isKse100: true },
  'SSGC': { basePrice: 16.50, pe: 5.2, eps: 3.1, divYield: 0.0, isKse100: false },
  'PRL': { basePrice: 31.40, pe: 4.5, eps: 6.9, divYield: 0.0, isKse100: true },
  'ATRL': { basePrice: 385.00, pe: 3.8, eps: 101.0, divYield: 6.5, isKse100: true },
  'NRL': { basePrice: 295.00, pe: 4.2, eps: 70.0, divYield: 0.0, isKse100: true },
  'SYS': { basePrice: 131.00, pe: 14.5, eps: 9.03, divYield: 2.5, isKse100: true },
  'TRG': { basePrice: 68.20, pe: 11.2, eps: 6.1, divYield: 0.0, isKse100: true },
  'NETSOL': { basePrice: 118.00, pe: 9.8, eps: 12.0, divYield: 3.2, isKse100: true },
  'AVN': { basePrice: 56.40, pe: 8.5, eps: 6.6, divYield: 4.0, isKse100: true },
  'PTC': { basePrice: 18.50, pe: 16.0, eps: 1.15, divYield: 0.0, isKse100: true },
  'WTL': { basePrice: 1.85, pe: 12.0, eps: 0.15, divYield: 0.0, isKse100: false },
  'TELE': { basePrice: 7.45, pe: 10.0, eps: 0.74, divYield: 0.0, isKse100: false },
  'HUMNL': { basePrice: 9.80, pe: 8.5, eps: 1.15, divYield: 5.0, isKse100: false },
  'PAEL': { basePrice: 26.80, pe: 7.5, eps: 3.5, divYield: 4.0, isKse100: true },
  'ENGRO': { basePrice: 385.00, pe: 6.5, eps: 59.0, divYield: 13.5, isKse100: true },
  'FFC': { basePrice: 549.00, pe: 5.2, eps: 105.5, divYield: 14.2, isKse100: true },
  'EFERT': { basePrice: 172.50, pe: 6.8, eps: 25.3, divYield: 12.8, isKse100: true },
  'FATIMA': { basePrice: 58.20, pe: 4.8, eps: 12.1, divYield: 9.5, isKse100: true },
  'FFBL': { basePrice: 42.50, pe: 5.4, eps: 7.8, divYield: 8.0, isKse100: true },
  'LUCK': { basePrice: 442.00, pe: 6.8, eps: 65.0, divYield: 3.8, isKse100: true },
  'DGKC': { basePrice: 212.00, pe: 7.2, eps: 29.4, divYield: 2.2, isKse100: true },
  'MLCF': { basePrice: 100.00, pe: 5.5, eps: 18.1, divYield: 4.5, isKse100: true },
  'CHCC': { basePrice: 194.00, pe: 6.1, eps: 31.8, divYield: 5.2, isKse100: true },
  'FCCL': { basePrice: 38.50, pe: 5.8, eps: 6.6, divYield: 6.0, isKse100: true },
  'PIOC': { basePrice: 148.00, pe: 5.9, eps: 25.0, divYield: 6.0, isKse100: true },
  'MEBL': { basePrice: 573.99, pe: 4.5, eps: 127.5, divYield: 11.5, isKse100: true },
  'MCB': { basePrice: 285.00, pe: 4.2, eps: 67.8, divYield: 14.8, isKse100: true },
  'HBL': { basePrice: 154.50, pe: 3.8, eps: 40.6, divYield: 9.2, isKse100: true },
  'UBL': { basePrice: 345.00, pe: 4.4, eps: 78.4, divYield: 15.0, isKse100: true },
  'BAFL': { basePrice: 85.80, pe: 3.6, eps: 23.8, divYield: 12.0, isKse100: true },
  'BAHL': { basePrice: 115.00, pe: 3.5, eps: 32.8, divYield: 13.0, isKse100: true },
  'NBP': { basePrice: 76.10, pe: 3.2, eps: 23.7, divYield: 0.0, isKse100: true },
  'BOP': { basePrice: 6.85, pe: 4.8, eps: 1.42, divYield: 0.0, isKse100: true },
  'BIPL': { basePrice: 28.50, pe: 4.1, eps: 6.9, divYield: 7.0, isKse100: false },
  'HUBC': { basePrice: 210.71, pe: 3.9, eps: 54.0, divYield: 16.5, isKse100: true },
  'KAPCO': { basePrice: 38.50, pe: 4.0, eps: 9.6, divYield: 14.0, isKse100: true },
  'KEL': { basePrice: 5.20, pe: 8.0, eps: 0.65, divYield: 0.0, isKse100: true },
  'NCPL': { basePrice: 32.00, pe: 3.5, eps: 9.1, divYield: 18.0, isKse100: false },
  'NPL': { basePrice: 28.50, pe: 3.6, eps: 7.9, divYield: 17.5, isKse100: false },
  'INDU': { basePrice: 1952.00, pe: 9.5, eps: 205.4, divYield: 5.5, isKse100: true },
  'MTL': { basePrice: 680.00, pe: 7.2, eps: 94.4, divYield: 13.0, isKse100: true },
  'HCAR': { basePrice: 320.00, pe: 12.0, eps: 26.6, divYield: 2.8, isKse100: true },
  'PSMC': { basePrice: 605.00, pe: 8.0, eps: 75.0, divYield: 0.0, isKse100: false },
  'AGP': { basePrice: 158.00, pe: 8.2, eps: 19.2, divYield: 4.5, isKse100: true },
  'SEARL': { basePrice: 72.50, pe: 10.5, eps: 6.9, divYield: 2.0, isKse100: true },
  'ABOT': { basePrice: 940.00, pe: 13.5, eps: 69.6, divYield: 3.5, isKse100: true },
  'GLAXO': { basePrice: 185.00, pe: 11.0, eps: 16.8, divYield: 4.0, isKse100: true },
  'MUGHAL': { basePrice: 108.40, pe: 6.0, eps: 18.0, divYield: 4.0, isKse100: true },
  'ISL': { basePrice: 94.00, pe: 5.8, eps: 16.2, divYield: 7.0, isKse100: true },
  'INIL': { basePrice: 185.00, pe: 6.5, eps: 28.4, divYield: 6.0, isKse100: true },
  'ASTL': { basePrice: 24.50, pe: 8.0, eps: 3.0, divYield: 0.0, isKse100: false },
  'NESTLE': { basePrice: 7450.00, pe: 18.0, eps: 413.8, divYield: 4.2, isKse100: true },
  'NATF': { basePrice: 188.00, pe: 15.0, eps: 12.5, divYield: 3.0, isKse100: true },
  'UNITY': { basePrice: 28.40, pe: 8.5, eps: 3.34, divYield: 0.0, isKse100: true },
  'TOMCL': { basePrice: 38.00, pe: 7.0, eps: 5.4, divYield: 5.0, isKse100: true },
  'ILP': { basePrice: 88.50, pe: 6.2, eps: 14.2, divYield: 6.5, isKse100: true },
  'NML': { basePrice: 92.20, pe: 4.0, eps: 23.0, divYield: 6.0, isKse100: true },
  'GATM': { basePrice: 48.50, pe: 4.5, eps: 10.7, divYield: 8.0, isKse100: false }
};

let cachedUniverse = null;
let lastUniverseFetch = 0;

export const fetchFullPSXUniverse = async () => {
  const now = Date.now();
  if (cachedUniverse && (now - lastUniverseFetch < 3600000)) {
    return cachedUniverse;
  }

  console.log('📡 Fetching complete PSX Universe of all listed companies from PSX DPS...');
  try {
    const res = await axios.get('https://dps.psx.com.pk/symbols', { headers: HEADERS, timeout: 8000 });
    const allSymbols = res.data || [];
    
    // Filter out pure debt, bills/bonds and duplicate future contracts
    const equities = allSymbols.filter(s => 
      !s.isDebt && 
      s.sectorName !== 'BILLS AND BONDS' && 
      !s.symbol.endsWith('FUT') && 
      !s.symbol.endsWith('-FUT')
    );

    console.log(`✅ Fetched ${equities.length} listed PSX equity companies.`);

    const fullUniverse = equities.map((eq) => {
      const sym = eq.symbol.trim();
      const known = KNOWN_BENCHMARKS[sym];
      const sector = eq.sectorName || 'General Industrials';

      // Deterministic synthetic baseline if not in known benchmark list
      let basePrice = 45.0;
      if (known) {
        basePrice = known.basePrice;
      } else {
        // Hash symbol to consistent price bracket
        let hash = 0;
        for (let i = 0; i < sym.length; i++) hash = (hash << 5) - hash + sym.charCodeAt(i);
        const absHash = Math.abs(hash);
        basePrice = Number((12.50 + (absHash % 320) + ((absHash % 100) / 100)).toFixed(2));
      }

      const pe = known?.pe || Number((3.5 + (basePrice % 12)).toFixed(1));
      const eps = known?.eps || Number((basePrice / pe).toFixed(2));
      const divYield = known?.divYield || Number(((basePrice % 14)).toFixed(1));
      const isKse100 = known?.isKse100 || (basePrice > 100 && (sym.length <= 4));

      return {
        symbol: sym,
        name: eq.name ? eq.name.trim() : sym,
        sector,
        basePrice,
        pe,
        eps,
        divYield,
        isKse100
      };
    });

    cachedUniverse = fullUniverse;
    lastUniverseFetch = now;
    return fullUniverse;
  } catch (err) {
    console.warn('⚠️ Could not fetch symbols endpoint (' + err.message + '). Using standard universe.');
    // Fallback to list of known benchmarks
    return Object.entries(KNOWN_BENCHMARKS).map(([sym, val]) => ({
      symbol: sym,
      name: sym,
      sector: 'General Market',
      ...val
    }));
  }
};

export const generateHistoricalSeries = (basePrice, trendBias = 0.001) => {
  const points = [];
  const now = new Date();
  let current = basePrice * 0.92;
  const baseVolume = 1500000;

  for (let i = 30; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dailyChange = (Math.random() - 0.48 + trendBias) * (basePrice * 0.024);
    current = Math.max(basePrice * 0.4, current + dailyChange);
    const dayHigh = current + Math.random() * (basePrice * 0.012);
    const dayLow = Math.max(basePrice * 0.35, current - Math.random() * (basePrice * 0.012));
    const dayOpen = dayLow + Math.random() * (dayHigh - dayLow);
    const volMultiplier = 0.6 + Math.random() * 1.8;

    points.push({
      date: d.toISOString().split('T')[0],
      open: Number(dayOpen.toFixed(2)),
      high: Number(dayHigh.toFixed(2)),
      low: Number(dayLow.toFixed(2)),
      close: Number(current.toFixed(2)),
      volume: Math.round(baseVolume * volMultiplier)
    });
  }

  points[points.length - 1].close = basePrice;
  return points;
};
