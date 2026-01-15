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

  // LCU (League Client) configuration
  lcu: {
    protocol: 'https',
    host: '127.0.0.1',
    // Port and token are discovered dynamically from lockfile
    lockfilePath: process.env.LCU_LOCKFILE_PATH || 
      (process.platform === 'win32' 
        ? 'C:\\Riot Games\\League of Legends\\lockfile'
        : '/Applications/League of Legends.app/Contents/LoL/lockfile'),
    reconnectInterval: 5000, // ms
    requestTimeout: 10000 // ms
  },

  // Data service configuration
  dataService: {
    cacheDuration: 3600000, // 1 hour in milliseconds
    retryAttempts: 3,
    retryDelay: 2000, // ms
    endpoints: {
      ugg: {
        base: 'https://u.gg/api',
        version: 'v2',
        // U.GG uses dynamic patch version, will be fetched
      }
    }
  } as DataServiceConfig,

  // Default recommendation weights
  defaultWeights: {
    winRate: 0.40,      // 40% - Most important for raw strength
    pickRate: 0.10,     // 10% - Indicates reliability/meta presence
    counterScore: 0.30, // 30% - Critical for laning phase
    synergyScore: 0.20  // 20% - Team composition matters
  } as RecommendationWeights,

  // Cache settings
  cache: {
    championStatsExpiry: 3600000, // 1 hour
    matchupDataExpiry: 7200000,   // 2 hours
    patchDataExpiry: 86400000     // 24 hours
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
    enableAdvancedMetrics: true
  }
};

export default config;