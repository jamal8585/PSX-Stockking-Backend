
import axios from 'axios';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

// Top prominent liquid stocks with known fundamentals
export const KNOWN_BENCHMARKS = {
  'OGDC': { basePrice: 328.70, pe: 4.8, eps: 51.0, divYield: 11.2, isKse100: true, sector: 'Oil & Gas Exploration Companies' },
  'PPL': { basePrice: 234.50, pe: 4.4, eps: 53.8, divYield: 9.8, isKse100: true, sector: 'Oil & Gas Exploration Companies' },
  'MARI': { basePrice: 663.26, pe: 5.6, eps: 119.2, divYield: 8.5, isKse100: true, sector: 'Oil & Gas Exploration Companies' },
  'POL': { basePrice: 512.00, pe: 6.2, eps: 82.5, divYield: 12.0, isKse100: true, sector: 'Oil & Gas Exploration Companies' },
  'PSO': { basePrice: 363.84, pe: 4.1, eps: 88.0, divYield: 6.5, isKse100: true, sector: 'Oil & Gas Marketing Companies' },
  'SNGP': { basePrice: 112.50, pe: 3.9, eps: 28.0, divYield: 8.0, isKse100: true, sector: 'Oil & Gas Marketing Companies' },
  'SSGC': { basePrice: 16.50, pe: 5.2, eps: 3.1, divYield: 0.0, isKse100: false, sector: 'Oil & Gas Marketing Companies' },
  'PRL': { basePrice: 108.81, pe: 3.72, eps: 6.9, divYield: 0.0, isKse100: true, sector: 'Refinery' },
  'ATRL': { basePrice: 385.00, pe: 3.8, eps: 101.0, divYield: 6.5, isKse100: true, sector: 'Refinery' },
  'NRL': { basePrice: 295.00, pe: 4.2, eps: 70.0, divYield: 0.0, isKse100: true, sector: 'Refinery' },
  'CNERGY': { basePrice: 15.46, pe: 5.0, eps: 1.2, divYield: 0.0, isKse100: true, sector: 'Refinery' },
  'SYS': { basePrice: 124.54, pe: 14.5, eps: 9.03, divYield: 2.5, isKse100: true, sector: 'Technology & Communication' },
  'TRG': { basePrice: 68.20, pe: 11.2, eps: 6.1, divYield: 0.0, isKse100: true, sector: 'Technology & Communication' },
  'NETSOL': { basePrice: 118.00, pe: 9.8, eps: 12.0, divYield: 3.2, isKse100: true, sector: 'Technology & Communication' },
  'AVN': { basePrice: 56.40, pe: 8.5, eps: 6.6, divYield: 4.0, isKse100: true, sector: 'Technology & Communication' },
  'PTC': { basePrice: 18.50, pe: 16.0, eps: 1.15, divYield: 0.0, isKse100: true, sector: 'Technology & Communication' },
  'WTL': { basePrice: 1.16, pe: 12.0, eps: 0.15, divYield: 0.0, isKse100: false, sector: 'Technology & Communication' },
  'TELE': { basePrice: 7.45, pe: 10.0, eps: 0.74, divYield: 0.0, isKse100: false, sector: 'Technology & Communication' },
  'HUMNL': { basePrice: 9.80, pe: 8.5, eps: 1.15, divYield: 5.0, isKse100: false, sector: 'Technology & Communication' },
  'PAEL': { basePrice: 26.80, pe: 7.5, eps: 3.5, divYield: 4.0, isKse100: true, sector: 'Cable & Electrical Goods' },
  'ENGRO': { basePrice: 385.00, pe: 6.5, eps: 59.0, divYield: 13.5, isKse100: true, sector: 'Fertilizer' },
  'FFC': { basePrice: 552.70, pe: 5.2, eps: 105.5, divYield: 14.2, isKse100: true, sector: 'Fertilizer' },
  'EFERT': { basePrice: 172.50, pe: 6.8, eps: 25.3, divYield: 12.8, isKse100: true, sector: 'Fertilizer' },
  'FATIMA': { basePrice: 58.20, pe: 4.8, eps: 12.1, divYield: 9.5, isKse100: true, sector: 'Fertilizer' },
  'FFBL': { basePrice: 42.50, pe: 5.4, eps: 7.8, divYield: 8.0, isKse100: true, sector: 'Fertilizer' },
  'LUCK': { basePrice: 437.33, pe: 6.8, eps: 65.0, divYield: 3.8, isKse100: true, sector: 'Cement' },
  'DGKC': { basePrice: 212.00, pe: 7.2, eps: 29.4, divYield: 2.2, isKse100: true, sector: 'Cement' },
  'MLCF': { basePrice: 100.00, pe: 5.5, eps: 18.1, divYield: 4.5, isKse100: true, sector: 'Cement' },
  'CHCC': { basePrice: 194.00, pe: 6.1, eps: 31.8, divYield: 5.2, isKse100: true, sector: 'Cement' },
  'FCCL': { basePrice: 38.50, pe: 5.8, eps: 6.6, divYield: 6.0, isKse100: true, sector: 'Cement' },
  'PIOC': { basePrice: 148.00, pe: 5.9, eps: 25.0, divYield: 6.0, isKse100: true, sector: 'Cement' },
  'MEBL': { basePrice: 573.99, pe: 4.5, eps: 127.5, divYield: 11.5, isKse100: true, sector: 'Commercial Banks' },
  'MCB': { basePrice: 285.00, pe: 4.2, eps: 67.8, divYield: 14.8, isKse100: true, sector: 'Commercial Banks' },
  'HBL': { basePrice: 154.50, pe: 3.8, eps: 40.6, divYield: 9.2, isKse100: true, sector: 'Commercial Banks' },
  'UBL': { basePrice: 345.00, pe: 4.4, eps: 78.4, divYield: 15.0, isKse100: true, sector: 'Commercial Banks' },
  'BAFL': { basePrice: 85.80, pe: 3.6, eps: 23.8, divYield: 12.0, isKse100: true, sector: 'Commercial Banks' },
  'BAHL': { basePrice: 115.00, pe: 3.5, eps: 32.8, divYield: 13.0, isKse100: true, sector: 'Commercial Banks' },
  'NBP': { basePrice: 76.10, pe: 3.2, eps: 23.7, divYield: 0.0, isKse100: true, sector: 'Commercial Banks' },
  'BOP': { basePrice: 34.99, pe: 4.8, eps: 1.42, divYield: 0.0, isKse100: true, sector: 'Commercial Banks' },
  'BIPL': { basePrice: 24.33, pe: 4.1, eps: 6.9, divYield: 7.0, isKse100: false, sector: 'Commercial Banks' },
  'HUBC': { basePrice: 210.71, pe: 3.9, eps: 54.0, divYield: 16.5, isKse100: true, sector: 'Power Generation & Distribution' },
  'KAPCO': { basePrice: 38.50, pe: 4.0, eps: 9.6, divYield: 14.0, isKse100: true, sector: 'Power Generation & Distribution' },
  'KEL': { basePrice: 5.20, pe: 8.0, eps: 0.65, divYield: 0.0, isKse100: true, sector: 'Power Generation & Distribution' },
  'NCPL': { basePrice: 32.00, pe: 3.5, eps: 9.1, divYield: 18.0, isKse100: false, sector: 'Power Generation & Distribution' },
  'NPL': { basePrice: 28.50, pe: 3.6, eps: 7.9, divYield: 17.5, isKse100: false, sector: 'Power Generation & Distribution' },
  'INDU': { basePrice: 1952.00, pe: 9.5, eps: 205.4, divYield: 5.5, isKse100: true, sector: 'Automobile Assembler' },
  'MTL': { basePrice: 680.00, pe: 7.2, eps: 94.4, divYield: 13.0, isKse100: true, sector: 'Automobile Assembler' },
  'HCAR': { basePrice: 320.00, pe: 12.0, eps: 26.6, divYield: 2.8, isKse100: true, sector: 'Automobile Assembler' },
  'PSMC': { basePrice: 605.00, pe: 8.0, eps: 75.0, divYield: 0.0, isKse100: false, sector: 'Automobile Assembler' },
  'AGP': { basePrice: 158.00, pe: 8.2, eps: 19.2, divYield: 4.5, isKse100: true, sector: 'Pharmaceuticals' },
  'SEARL': { basePrice: 72.50, pe: 10.5, eps: 6.9, divYield: 2.0, isKse100: true, sector: 'Pharmaceuticals' },
  'ABOT': { basePrice: 940.00, pe: 13.5, eps: 69.6, divYield: 3.5, isKse100: true, sector: 'Pharmaceuticals' },
  'GLAXO': { basePrice: 185.00, pe: 11.0, eps: 16.8, divYield: 4.0, isKse100: true, sector: 'Pharmaceuticals' },
  'MUGHAL': { basePrice: 108.40, pe: 6.0, eps: 18.0, divYield: 4.0, isKse100: true, sector: 'Engineering' },
  'ISL': { basePrice: 94.00, pe: 5.8, eps: 16.2, divYield: 7.0, isKse100: true, sector: 'Engineering' },
  'INIL': { basePrice: 185.00, pe: 6.5, eps: 28.4, divYield: 6.0, isKse100: true, sector: 'Engineering' },
  'ASTL': { basePrice: 24.50, pe: 8.0, eps: 3.0, divYield: 0.0, isKse100: false, sector: 'Engineering' },
  'NESTLE': { basePrice: 7450.00, pe: 18.0, eps: 413.8, divYield: 4.2, isKse100: true, sector: 'Food & Personal Care Products' },
  'NATF': { basePrice: 188.00, pe: 15.0, eps: 12.5, divYield: 3.0, isKse100: true, sector: 'Food & Personal Care Products' },
  'UNITY': { basePrice: 28.40, pe: 8.5, eps: 3.34, divYield: 0.0, isKse100: true, sector: 'Food & Personal Care Products' },
  'TOMCL': { basePrice: 38.00, pe: 7.0, eps: 5.4, divYield: 5.0, isKse100: true, sector: 'Food & Personal Care Products' },
  'ILP': { basePrice: 88.50, pe: 6.2, eps: 14.2, divYield: 6.5, isKse100: true, sector: 'Textile Composite' },
  'NML': { basePrice: 92.20, pe: 4.0, eps: 23.0, divYield: 6.0, isKse100: true, sector: 'Textile Composite' },
  'GATM': { basePrice: 48.50, pe: 4.5, eps: 10.7, divYield: 8.0, isKse100: false, sector: 'Textile Composite' }
};

export const PSX_COMPANY_NAMES = {
  'PRL': 'Pakistan Refinery Limited',
  'CNERGY': 'Cynergico PK Limited',
  'ATRL': 'Attock Refinery Limited',
  'NRL': 'National Refinery Limited',
  'OGDC': 'Oil & Gas Development Company Limited',
  'PPL': 'Pakistan Petroleum Limited',
  'MARI': 'Mari Petroleum Company Limited',
  'POL': 'Pakistan Oilfields Limited',
  'PSO': 'Pakistan State Oil Company Limited',
  'SNGP': 'Sui Northern Gas Pipelines Limited',
  'SSGC': 'Sui Southern Gas Company Limited',
  'MEBL': 'Meezan Bank Limited',
  'MCB': 'MCB Bank Limited',
  'UBL': 'United Bank Limited',
  'HBL': 'Habib Bank Limited',
  'BAFL': 'Bank Alfalah Limited',
  'BAHL': 'Bank AL Habib Limited',
  'NBP': 'National Bank of Pakistan',
  'BOP': 'The Bank of Punjab',
  'BIPL': 'BankIslami Pakistan Limited',
  'SYS': 'Systems Limited',
  'TRG': 'TRG Pakistan Limited',
  'NETSOL': 'NetSol Technologies Limited',
  'AVN': 'Avanceon Limited',
  'PTC': 'Pakistan Telecommunication Company Limited',
  'WTL': 'WorldCall Telecom Limited',
  'TELE': 'Telecard Limited',
  'HUMNL': 'Hum Network Limited',
  'PAEL': 'Pak Elektron Limited',
  'ENGRO': 'Engro Corporation Limited',
  'FFC': 'Fauji Fertilizer Company Limited',
  'EFERT': 'Engro Fertilizers Limited',
  'FATIMA': 'Fatima Fertilizer Company Limited',
  'FFBL': 'Fauji Fertilizer Bin Qasim Limited',
  'AGL': 'Agritech Limited',
  'LUCK': 'Lucky Cement Limited',
  'DGKC': 'D.G. Khan Cement Company Limited',
  'MLCF': 'Maple Leaf Cement Factory Limited',
  'CHCC': 'Cherat Cement Company Limited',
  'FCCL': 'Fauji Cement Company Limited',
  'PIOC': 'Pioneer Cement Limited',
  'ACPL': 'Attock Cement Pakistan Limited',
  'HUBC': 'The Hub Power Company Limited',
  'KAPCO': 'Kot Addu Power Company Limited',
  'KEL': 'K-Electric Limited',
  'NCPL': 'Nishat Chunian Power Limited',
  'NPL': 'Nishat Power Limited',
  'INDU': 'Indus Motor Company Limited',
  'MTL': 'Millat Tractors Limited',
  'HCAR': 'Honda Atlas Cars (Pakistan) Limited',
  'PSMC': 'Pak Suzuki Motor Company Limited',
  'SEARL': 'The Searle Company Limited',
  'AGP': 'AGP Limited',
  'ABOT': 'Abbott Laboratories (Pakistan) Limited',
  'GLAXO': 'GlaxoSmithKline (Pakistan) Limited',
  'MUGHAL': 'Mughal Iron & Steel Industries Limited',
  'ISL': 'International Steels Limited',
  'INIL': 'International Industries Limited',
  'ASTL': 'Amreli Steels Limited',
  'NESTLE': 'Nestle Pakistan Limited',
  'NATF': 'National Foods Limited',
  'UNITY': 'Unity Foods Limited',
  'TOMCL': 'The Organic Meat Company Limited',
  'ILP': 'Interloop Limited',
  'NML': 'Nishat Mills Limited',
  'GATM': 'Gul Ahmed Textile Mills Limited'
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
      const sector = known?.sector || eq.sectorName || 'Miscellaneous';
      const fullName = PSX_COMPANY_NAMES[sym] || (eq.name && eq.name.trim() !== sym ? eq.name.trim() : null) || known?.name || sym;

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
        name: fullName,
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
      name: PSX_COMPANY_NAMES[sym] || sym,
      sector: val.sector || 'Miscellaneous',
      ...val
    }));
  }
};

export const generateHistoricalSeries = (basePrice, symbol = 'PSX', trendBias = 0.001) => {
  const points = [];
  const now = new Date();
  const baseVolume = 1500000;
  
  // Seed deterministic hash from symbol
  const symStr = String(symbol || 'PSX').toUpperCase().trim();
  let symHash = 0;
  for (let c = 0; c < symStr.length; c++) {
    symHash = (symHash << 5) - symHash + symStr.charCodeAt(c);
    symHash |= 0;
  }
  const absHash = Math.abs(symHash);

  // Generate 100 historical bars so 20 SMA, 50 SMA, 50 EMA always have full history
  const barCount = 100;
  let current = basePrice * (0.88 + ((absHash % 15) / 100));

  for (let i = barCount; i >= 1; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // Deterministic sinusoidal wave combined with symbol hash
    const cycle = Math.sin((barCount - i) * 0.18 + (absHash % 10)) * 0.012;
    const progress = ((barCount - i) / barCount) * (basePrice - current);
    current = Number((current + cycle * basePrice + progress * 0.035).toFixed(2));
    
    const daySpread = Math.max(0.2, basePrice * (0.012 + ((absHash % 8) / 1000)));
    const dayHigh = Number((current + daySpread * 0.6).toFixed(2));
    const dayLow = Number((Math.max(0.1, current - daySpread * 0.6)).toFixed(2));
    const dayOpen = Number(((dayHigh + dayLow) / 2).toFixed(2));
    const vol = Math.round(baseVolume * (0.8 + Math.cos(i * 0.25) * 0.35 + ((absHash % 5) * 0.1)));

    points.push({
      date: d.toISOString().split('T')[0],
      open: dayOpen,
      high: dayHigh,
      low: dayLow,
      close: current,
      volume: vol
    });
  }

  // Final bar is today's basePrice
  const todayDate = now.toISOString().split('T')[0];
  const todaySpread = Math.max(0.2, basePrice * 0.012);
  points.push({
    date: todayDate,
    open: Number((basePrice * 0.995).toFixed(2)),
    high: Number((basePrice + todaySpread * 0.6).toFixed(2)),
    low: Number((Math.max(0.1, basePrice - todaySpread * 0.6)).toFixed(2)),
    close: basePrice,
    volume: baseVolume
  });

  return points;
};
