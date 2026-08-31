
export const REALTIME_NEWS_FEED = [
  {
    title: "State Bank of Pakistan Signals Further Rate Cuts as Inflation Drops to 4.2% YoY",
    source: "State Bank of Pakistan / Financial Bureau",
    publishedAt: new Date(Date.now() - 1000 * 60 * 8), // 8 mins ago
    timeAgo: "8 mins ago",
    category: "MACRO_ECONOMY",
    sentiment: "POSITIVE",
    sentimentScore: 0.88,
    impactSeverity: "HIGH",
    impactSummary: "Aggressive reduction in benchmark policy rate lowers borrowing & finance costs for heavy capital sectors (Cement, Steel, Automobiles) while channeling liquid capital into equity markets.",
    impactedSectors: ["CEMENT", "AUTOMOBILE", "COMMERCIAL_BANKS", "TECHNOLOGY"],
    tradeSuggestions: [
      {
        symbol: "LUCK",
        name: "Lucky Cement Limited",
        sector: "Cement",
        action: "BUY_NOW",
        currentPrice: 945.00,
        volume: 3850000,
        volumeSpike: 2.1,
        entryPriceMin: 938.00,
        entryPriceMax: 948.00,
        stopLoss: 915.00,
        targetSellPrice: 1025.00,
        targetSellPrice2: 1080.00,
        expectedGainPct: 8.46,
        riskReward: "1 : 2.7",
        tradeReason: "Major beneficiary of interest rate cuts; high operating leverage and expanding domestic despatches."
      },
      {
        symbol: "DGKC",
        name: "D.G. Khan Cement Co Ltd",
        sector: "Cement",
        action: "BUY_ON_DIP",
        currentPrice: 88.50,
        volume: 14200000,
        volumeSpike: 2.8,
        entryPriceMin: 86.50,
        entryPriceMax: 89.00,
        stopLoss: 83.00,
        targetSellPrice: 99.50,
        targetSellPrice2: 106.00,
        expectedGainPct: 12.43,
        riskReward: "1 : 3.1",
        tradeReason: "High financial leverage drops debt servicing significantly with each 100bps rate cut."
      },
      {
        symbol: "INDU",
        name: "Indus Motor Company",
        sector: "Automobile Assembler",
        action: "BUY_NOW",
        currentPrice: 1820.00,
        volume: 850000,
        volumeSpike: 1.6,
        entryPriceMin: 1805.00,
        entryPriceMax: 1830.00,
        stopLoss: 1740.00,
        targetSellPrice: 1980.00,
        targetSellPrice2: 2050.00,
        expectedGainPct: 8.79,
        riskReward: "1 : 2.0",
        tradeReason: "Auto financing demand rebounds rapidly with cheaper consumer car loan rates."
      }
    ]
  },
  {
    title: "Government Finalizes PKR 1.2 Trillion Energy Circular Debt Settlement Plan",
    source: "Ministry of Energy / Economic Coordination Committee",
    publishedAt: new Date(Date.now() - 1000 * 60 * 35), // 35 mins ago
    timeAgo: "35 mins ago",
    category: "OIL_GAS",
    sentiment: "POSITIVE",
    sentimentScore: 0.94,
    impactSeverity: "HIGH",
    impactSummary: "Historic structural resolution of energy sector receivables injecting massive liquid cash into E&P and OMC balance sheets, unlocking mega cash dividends.",
    impactedSectors: ["OIL_GAS", "POWER_ENERGY"],
    tradeSuggestions: [
      {
        symbol: "OGDC",
        name: "Oil & Gas Development Co",
        sector: "Oil & Gas Exploration",
        action: "BUY_NOW",
        currentPrice: 154.20,
        volume: 24800000,
        volumeSpike: 3.4,
        entryPriceMin: 152.00,
        entryPriceMax: 155.00,
        stopLoss: 147.00,
        targetSellPrice: 172.00,
        targetSellPrice2: 185.00,
        expectedGainPct: 11.54,
        riskReward: "1 : 2.5",
        tradeReason: "Direct multi-hundred-billion rupee cash recovery eliminates liquidity discount; potential bumper dividend."
      },
      {
        symbol: "PPL",
        name: "Pakistan Petroleum Limited",
        sector: "Oil & Gas Exploration",
        action: "BUY_NOW",
        currentPrice: 128.50,
        volume: 18400000,
        volumeSpike: 2.9,
        entryPriceMin: 126.50,
        entryPriceMax: 129.00,
        stopLoss: 122.00,
        targetSellPrice: 144.00,
        targetSellPrice2: 155.00,
        expectedGainPct: 12.06,
        riskReward: "1 : 2.4",
        tradeReason: "Clears overdue receivables, allowing CAPEX resumption in high-yield offshore and gas fields."
      },
      {
        symbol: "PSO",
        name: "Pakistan State Oil",
        sector: "Oil & Gas Marketing",
        action: "BUY_NOW",
        currentPrice: 208.40,
        volume: 9200000,
        volumeSpike: 2.2,
        entryPriceMin: 205.00,
        entryPriceMax: 210.00,
        stopLoss: 198.00,
        targetSellPrice: 232.00,
        targetSellPrice2: 248.00,
        expectedGainPct: 11.32,
        riskReward: "1 : 2.3",
        tradeReason: "Removes penal markup interest charges and bolsters fuel inventory purchasing power."
      }
    ]
  },
  {
    title: "Pakistan Tech Exports Surge to Record $320 Million in Single Month",
    source: "Ministry of IT & Telecom / P@SHA",
    publishedAt: new Date(Date.now() - 1000 * 60 * 95), // 1.5 hours ago
    timeAgo: "1.5 hours ago",
    category: "TECHNOLOGY",
    sentiment: "POSITIVE",
    sentimentScore: 0.89,
    impactSeverity: "HIGH",
    impactSummary: "Surging cloud software, AI automation, and enterprise exports to GCC, North America, and Europe driving top-line revenue expansion for listed IT firms.",
    impactedSectors: ["TECHNOLOGY"],
    tradeSuggestions: [
      {
        symbol: "SYS",
        name: "Systems Limited",
        sector: "Technology & Communication",
        action: "BUY_NOW",
        currentPrice: 462.50,
        volume: 4950000,
        volumeSpike: 1.8,
        entryPriceMin: 458.00,
        entryPriceMax: 465.00,
        stopLoss: 442.00,
        targetSellPrice: 515.00,
        targetSellPrice2: 550.00,
        expectedGainPct: 11.35,
        riskReward: "1 : 2.6",
        tradeReason: "Market leader in GCC IT digital transformations with strong USD revenues and margin expansion."
      },
      {
        symbol: "NETSOL",
        name: "NetSol Technologies",
        sector: "Technology & Communication",
        action: "BUY_ON_DIP",
        currentPrice: 118.00,
        volume: 5200000,
        volumeSpike: 1.7,
        entryPriceMin: 115.00,
        entryPriceMax: 119.00,
        stopLoss: 111.00,
        targetSellPrice: 134.00,
        targetSellPrice2: 145.00,
        expectedGainPct: 13.56,
        riskReward: "1 : 2.3",
        tradeReason: "Global automotive finance cloud SaaS contracts accelerating ARR growth."
      },
      {
        symbol: "TRG",
        name: "TRG Pakistan Limited",
        sector: "Technology & Communication",
        action: "ACCUMULATE",
        currentPrice: 68.20,
        volume: 16800000,
        volumeSpike: 2.0,
        entryPriceMin: 66.50,
        entryPriceMax: 69.00,
        stopLoss: 64.00,
        targetSellPrice: 79.00,
        targetSellPrice2: 86.00,
        expectedGainPct: 15.83,
        riskReward: "1 : 2.6",
        tradeReason: "High-beta AI recovery play; testing key reversal support levels."
      }
    ]
  },
  {
    title: "International Thermal Coal Prices Slump to $92/Ton; Gross Margins Set to Expand",
    source: "Global Commodity Desk / Reuters Energy",
    publishedAt: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    timeAgo: "3 hours ago",
    category: "CEMENT",
    sentiment: "POSITIVE",
    sentimentScore: 0.82,
    impactSeverity: "MEDIUM",
    impactSummary: "Richard Bay coal drop reduces fuel input costs by ~PKR 450 per bag of cement, boosting gross margin percentage by 350-450 basis points.",
    impactedSectors: ["CEMENT"],
    tradeSuggestions: [
      {
        symbol: "MLCF",
        name: "Maple Leaf Cement Factory",
        sector: "Cement",
        action: "BUY_NOW",
        currentPrice: 42.10,
        volume: 18500000,
        volumeSpike: 2.1,
        entryPriceMin: 41.50,
        entryPriceMax: 42.50,
        stopLoss: 39.80,
        targetSellPrice: 48.00,
        targetSellPrice2: 52.00,
        expectedGainPct: 14.01,
        riskReward: "1 : 2.6",
        tradeReason: "Direct cost savings on coal imports combined with solar energy integration."
      },
      {
        symbol: "CHCC",
        name: "Cherat Cement Co Ltd",
        sector: "Cement",
        action: "BUY_NOW",
        currentPrice: 194.00,
        volume: 2400000,
        volumeSpike: 1.5,
        entryPriceMin: 191.00,
        entryPriceMax: 195.00,
        stopLoss: 184.00,
        targetSellPrice: 218.00,
        targetSellPrice2: 232.00,
        expectedGainPct: 12.37,
        riskReward: "1 : 2.4",
        tradeReason: "Extremely efficient captive power setup magnifying gross margin expansion."
      }
    ]
  },
  {
    title: "ECC Considers Unification of Feed Gas Prices; Subsidies Under Review",
    source: "Petroleum Division / Business Recorder",
    publishedAt: new Date(Date.now() - 1000 * 60 * 320), // 5.3 hours ago
    timeAgo: "5.3 hours ago",
    category: "FERTILIZER",
    sentiment: "NEGATIVE",
    sentimentScore: -0.65,
    impactSeverity: "HIGH",
    impactSummary: "Policy push to remove concessionary gas tariffs could compress operational margins for fertilizer players reliant on subsidized feed gas.",
    impactedSectors: ["FERTILIZER"],
    tradeSuggestions: [
      {
        symbol: "EFERT",
        name: "Engro Fertilizers Limited",
        sector: "Fertilizer",
        action: "SELL_EXIT",
        currentPrice: 172.50,
        volume: 8900000,
        volumeSpike: 1.9,
        entryPriceMin: 0,
        entryPriceMax: 0,
        stopLoss: 168.00,
        targetSellPrice: 158.00,
        targetSellPrice2: 150.00,
        expectedGainPct: -8.41,
        riskReward: "Avoid / Take Profit",
        tradeReason: "Potential feed gas tariff hike risks gross margin compression in upcoming quarters."
      },
      {
        symbol: "FFC",
        name: "Fauji Fertilizer Company",
        sector: "Fertilizer",
        action: "ACCUMULATE",
        currentPrice: 280.00,
        volume: 6400000,
        volumeSpike: 1.2,
        entryPriceMin: 275.00,
        entryPriceMax: 282.00,
        stopLoss: 268.00,
        targetSellPrice: 308.00,
        targetSellPrice2: 325.00,
        expectedGainPct: 10.00,
        riskReward: "1 : 2.3",
        tradeReason: "Mari network pricing power cushions cost shocks far better than peers; high dividend defensive moat."
      }
    ]
  },
  {
    title: "FBR Imposes Additional Surcharge on Commercial Banks with Low ADR",
    source: "Federal Board of Revenue",
    publishedAt: new Date(Date.now() - 1000 * 60 * 480), // 8 hours ago
    timeAgo: "8 hours ago",
    category: "COMMERCIAL_BANKS",
    sentiment: "NEGATIVE",
    sentimentScore: -0.58,
    impactSeverity: "MEDIUM",
    impactSummary: "Banks with private sector Advances-to-Deposit Ratio (ADR) under 50% face up to 10% additional income tax on government treasury bond yields.",
    impactedSectors: ["COMMERCIAL_BANKS"],
    tradeSuggestions: [
      {
        symbol: "UBL",
        name: "United Bank Limited",
        sector: "Commercial Banks",
        action: "AVOID",
        currentPrice: 310.00,
        volume: 7200000,
        volumeSpike: 1.4,
        entryPriceMin: 0,
        entryPriceMax: 0,
        stopLoss: 302.00,
        targetSellPrice: 288.00,
        targetSellPrice2: 275.00,
        expectedGainPct: -7.10,
        riskReward: "Avoid / Take Profit",
        tradeReason: "High sovereign bond holdings create tax drag unless bank rapidly expands corporate loan portfolio."
      },
      {
        symbol: "MEBL",
        name: "Meezan Bank Limited",
        sector: "Commercial Banks",
        action: "BUY_NOW",
        currentPrice: 242.00,
        volume: 5800000,
        volumeSpike: 1.5,
        entryPriceMin: 238.00,
        entryPriceMax: 244.00,
        stopLoss: 232.00,
        targetSellPrice: 268.00,
        targetSellPrice2: 282.00,
        expectedGainPct: 10.74,
        riskReward: "1 : 2.6",
        tradeReason: "Islamic banking model maintains superior ADR and zero exposure to conventional treasury tax penalties."
      }
    ]
  }
];

export const getNewsSentimentImpactForStock = (symbol, newsList = REALTIME_NEWS_FEED) => {
  for (const news of newsList) {
    if (news.tradeSuggestions) {
      const match = news.tradeSuggestions.find(t => t.symbol === symbol);
      if (match) {
        return {
          sentiment: match.action.startsWith('BUY') || match.action === 'ACCUMULATE' ? 'POSITIVE' : 'NEGATIVE',
          score: news.sentimentScore,
          headline: news.title,
          explanation: match.tradeReason
        };
      }
    }
  }

  return {
    sentiment: 'NEUTRAL',
    score: 0.0,
    headline: 'No major news catalyst today'
  };
};
