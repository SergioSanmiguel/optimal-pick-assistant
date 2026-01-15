import fs from 'fs';
import https from 'https';
import { WebSocket } from 'ws';
import config from '../config';
import logger from '../utils/logger';
import { LCUCredentials, LCUConnectionError, ChampionSelectState, PickedChampion } from '../types';

/**
 * Service to connect and interact with League Client (LCU API)
 * Uses WebSocket for real-time updates and HTTPS for REST requests
 */
class LCUService {
  private credentials: LCUCredentials | null = null;
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();

  constructor() {
    this.init();
  }

  /**
   * Initialize connection to League Client
   */
  private async init(): Promise<void> {
    try {
      await this.readLockfile();
      await this.connect();
    } catch (error) {
      logger.warn('Failed to connect to League Client on startup', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Read lockfile to get LCU credentials
   * The lockfile format: LeagueClient:<pid>:<port>:<token>:<protocol>
   */
  private async readLockfile(): Promise<void> {
    try {
      const content = fs.readFileSync(config.lcu.lockfilePath, 'utf8');
      const parts = content.split(':');

      if (parts.length !== 5) {
        throw new LCUConnectionError('Invalid lockfile format');
      }

      this.credentials = {
        port: parseInt(parts[2], 10),
        token: parts[3],
        protocol: parts[4]
      };

      logger.info(`LCU credentials found: port ${this.credentials.port}`);
    } catch (error) {
      throw new LCUConnectionError('Could not read lockfile. Is League Client running?');
    }
  }

  /**
   * Establish WebSocket connection for real-time events
   */
  private async connect(): Promise<void> {
    if (!this.credentials) {
      throw new LCUConnectionError('No credentials available');
    }

    const wsUrl = `wss://riot:${this.credentials.token}@127.0.0.1:${this.credentials.port}/`;
    
    this.ws = new WebSocket(wsUrl, {
      rejectUnauthorized: false // LCU uses self-signed certificates
    });

    this.ws.on('open', () => {
      logger.info('Connected to League Client WebSocket');
      this.isConnected = true;
      
      // Subscribe to champion select events
      this.subscribe('/lol-champ-select/v1/session');
    });

    this.ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        logger.error('Failed to parse WebSocket message', error);
      }
    });

    this.ws.on('close', () => {
      logger.warn('League Client WebSocket connection closed');
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.ws.on('error', (error) => {
      logger.error('League Client WebSocket error', error);
    });
  }

  /**
   * Subscribe to specific LCU endpoint via WebSocket
   */
  private subscribe(endpoint: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    const subscribeMessage = JSON.stringify([5, endpoint]);
    this.ws.send(subscribeMessage);
    logger.debug(`Subscribed to ${endpoint}`);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    // LCU WebSocket format: [opcode, endpoint, eventType, data]
    if (!Array.isArray(message) || message.length < 3) return;

    const [opcode, endpoint, eventType, data] = message;

    if (opcode === 8) { // Event message
      this.emitEvent(endpoint, { eventType, data });
    }
  }

  /**
   * Make HTTPS request to LCU API
   */
  private async request<T>(method: string, endpoint: string, body?: any): Promise<T> {
    if (!this.credentials) {
      throw new LCUConnectionError('No credentials available');
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: this.credentials!.port,
        path: endpoint,
        method: method,
        headers: {
          'Authorization': `Basic ${Buffer.from(`riot:${this.credentials!.token}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        rejectUnauthorized: false
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : null;
            resolve(parsed as T);
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(config.lcu.requestTimeout, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Get current champion select session
   */
  async getChampionSelectSession(): Promise<any> {
    try {
      return await this.request('GET', '/lol-champ-select/v1/session');
    } catch (error) {
      logger.debug('No active champion select session');
      return null;
    }
  }

  /**
   * Register event handler
   */
  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Emit event to registered handlers
   */
  private emitEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      logger.info('Attempting to reconnect to League Client...');
      try {
        await this.readLockfile();
        await this.connect();
      } catch (error) {
        logger.warn('Reconnection failed', error);
        this.scheduleReconnect();
      }
    }, config.lcu.reconnectInterval);
  }

  /**
   * Check connection status
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Graceful shutdown
   */
  destroy(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
    }
    this.eventHandlers.clear();
  }
}

export const lcuService = new LCUService();
export default lcuService;