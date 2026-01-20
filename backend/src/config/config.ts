import dotenv from 'dotenv';
import { DataServiceConfig, RecommendationWeights } from '../types';

dotenv.config();

export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    }
  },

  // Riot Games API configuration
  riot: {
    apiKey: process.env.RIOT_API_KEY || '',
    region: process.env.RIOT_REGION || 'europe', // americas, europe, asia, sea
    platform: process.env.RIOT_PLATFORM || 'euw1', // na1, euw1, kr, etc.
    rateLimit: {
      requestsPerSecond: 20,
      requestsPer2Minutes: 100
    }
  },

  // LCU (League Client) configuration
  lcu: {
    protocol: 'https',
    host: '127.0.0.1',
    lockfilePath: process.env.LCU_LOCKFILE_PATH || 
      (process.platform === 'win32' 
        ? 'D:/JUEGOS/Windows/Riot Games/League of Legends/lockfile'
        : '/Applications/League of Legends.app/Contents/LoL/lockfile'),
    reconnectInterval: 5000,
    requestTimeout: 10000
  },

  // Data service configuration (now using Riot API)
  dataService: {
    
    cacheDuration: 3600000, // 1 hour
    retryAttempts: 3,
    retryDelay: 2000,
    sampleSize: 200, // Number of matches to analyze per champion
    minMatches: 30 // Minimum matches required for stats
  } as DataServiceConfig,

  // Default recommendation weights
  defaultWeights: {
    winRate: 0.40,
    pickRate: 0.10,
    counterScore: 0.30,
    synergyScore: 0.20
  } as RecommendationWeights,

  // Cache settings
  cache: {
    championStatsExpiry: 3600000, // 1 hour
    matchupDataExpiry: 7200000, // 2 hours
    patchDataExpiry: 86400000, // 24 hours
    highEloPlayersExpiry: 86400000 // 24 hours
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: process.env.NODE_ENV === 'production'
  },

  // Feature flags
  features: {
    enableSynergyCalculation: true,
    enableCounterCalculation: true,
    enableAdvancedMetrics: true,
    useLCU: true // Can disable LCU if not available
  }
};

// Validate Riot API key on startup
if (!config.riot.apiKey && process.env.NODE_ENV === 'production') {
  console.error('⚠️  RIOT_API_KEY is not set! The application will not work properly.');
  console.error('   Get your API key from: https://developer.riotgames.com/');
}

export default config;