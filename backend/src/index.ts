import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from './config/config';
import { apiController } from './controllers/api.controller';
import logger from './utils/logger';
import lcuService from './services/lcu.service';
import cacheService from './services/cache.service';

/**
 * Main application entry point
 */
class Application {
  private app: Express;
  private server: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Configure Express middleware
   */
  private setupMiddleware(): void {
    // CORS
    this.app.use(cors(config.server.cors));

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((_req: Request, _res: Response, next: NextFunction) => {
      logger.debug(`${_req.method} ${_req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    const router = express.Router();

    // Health check
    router.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // API endpoints
    router.post('/api/recommendations', (req, res) => 
      apiController.getRecommendations(req, res));
    
    router.get('/api/champion-select', (req, res) => 
      apiController.getChampionSelect(req, res));
    
    router.get('/api/status', (req, res) => 
      apiController.getStatus(req, res));
    
    router.get('/api/champions', (req, res) => 
      apiController.getChampions(req, res));
    
    router.get('/api/champion/:id/stats/:role', (req, res) => 
      apiController.getChampionStats(req, res));
    
    router.post('/api/cache/clear', (req, res) => 
      apiController.clearCache(req, res));
    
    router.post('/api/cache/warmup', (req, res) => 
      apiController.warmupCache(req, res));

    this.app.use(router);

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });
  }

  /**
   * Setup global error handling
   */
  private setupErrorHandling(): void {
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      this.server = this.app.listen(config.server.port, () => {
        logger.info(`Server running on port ${config.server.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      // Stop accepting new connections
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }

      // Cleanup resources
      try {
        lcuService.destroy();
        cacheService.destroy();
        logger.info('Resources cleaned up');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled rejection:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
  }
}

// Start application
const app = new Application();
app.start();