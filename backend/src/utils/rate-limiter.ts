/**
 * Rate Limiter for Riot API
 * Ensures we stay within API rate limits
 */
export class RateLimiter {
  private queue: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests: number, timeWindowMs: number) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  /**
   * Wait until a slot is available
   */
  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove old timestamps outside the time window
    this.queue = this.queue.filter(timestamp => now - timestamp < this.timeWindow);

    // If at capacity, wait
    if (this.queue.length >= this.maxRequests) {
      const oldestRequest = this.queue[0];
      const waitTime = this.timeWindow - (now - oldestRequest) + 10; // +10ms buffer
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Recursive call after waiting
      return this.waitForSlot();
    }

    // Add current request to queue
    this.queue.push(now);
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    const now = Date.now();
    this.queue = this.queue.filter(timestamp => now - timestamp < this.timeWindow);
    return this.queue.length;
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.queue = [];
  }
}