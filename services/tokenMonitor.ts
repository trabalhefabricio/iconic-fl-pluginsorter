/**
 * Service for monitoring and tracking Gemini API token usage
 * Provides real-time token consumption statistics
 */

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCount: number;
  estimatedCost: number; // in USD
}

export interface TokenUsageStats extends TokenUsage {
  timestamp: number;
  resetAt: number; // When the counter will reset
}

class TokenMonitorService {
  private usage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    requestCount: 0,
    estimatedCost: 0,
  };

  private listeners: Set<(stats: TokenUsageStats) => void> = new Set();
  private resetInterval: number = 24 * 60 * 60 * 1000; // 24 hours
  private lastReset: number = Date.now();

  // Pricing for Gemini 2.5 Flash (approximate, per 1M tokens)
  private readonly PROMPT_COST_PER_1M = 0.075; // $0.075 per 1M prompt tokens
  private readonly COMPLETION_COST_PER_1M = 0.30; // $0.30 per 1M completion tokens

  /**
   * Record a new API request with token usage
   */
  recordUsage(promptTokens: number, completionTokens: number): void {
    this.usage.promptTokens += promptTokens;
    this.usage.completionTokens += completionTokens;
    this.usage.totalTokens += promptTokens + completionTokens;
    this.usage.requestCount += 1;

    // Calculate cost
    const promptCost = (promptTokens / 1_000_000) * this.PROMPT_COST_PER_1M;
    const completionCost = (completionTokens / 1_000_000) * this.COMPLETION_COST_PER_1M;
    this.usage.estimatedCost += promptCost + completionCost;

    this.notifyListeners();
  }

  /**
   * Estimate tokens for a given text (rough approximation)
   * Average: 1 token ≈ 4 characters for English text
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get current usage statistics
   */
  getStats(): TokenUsageStats {
    const now = Date.now();
    const resetAt = this.lastReset + this.resetInterval;

    return {
      ...this.usage,
      timestamp: now,
      resetAt,
    };
  }

  /**
   * Reset all counters (typically done daily)
   */
  reset(): void {
    this.usage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      requestCount: 0,
      estimatedCost: 0,
    };
    this.lastReset = Date.now();
    this.notifyListeners();
  }

  /**
   * Subscribe to usage updates
   */
  subscribe(listener: (stats: TokenUsageStats) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current stats
    listener(this.getStats());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of usage changes
   */
  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach(listener => listener(stats));
  }

  /**
   * Load usage from localStorage
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('tokenUsage');
      if (stored) {
        const data = JSON.parse(stored);
        this.usage = data.usage;
        this.lastReset = data.lastReset;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load token usage from storage:', error);
    }
  }

  /**
   * Save usage to localStorage
   */
  saveToStorage(): void {
    try {
      const data = {
        usage: this.usage,
        lastReset: this.lastReset,
      };
      localStorage.setItem('tokenUsage', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save token usage to storage:', error);
    }
  }

  /**
   * Format token count with K/M suffix
   */
  formatTokenCount(count: number): string {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(2)}M`;
    } else if (count >= 1_000) {
      return `${(count / 1_000).toFixed(1)}K`;
    }
    return count.toString();
  }

  /**
   * Format cost in USD
   */
  formatCost(cost: number): string {
    return `$${cost.toFixed(4)}`;
  }
}

// Export singleton instance
export const tokenMonitor = new TokenMonitorService();

// Auto-save on changes
tokenMonitor.subscribe(() => {
  tokenMonitor.saveToStorage();
});

// Load on initialization
if (typeof window !== 'undefined') {
  tokenMonitor.loadFromStorage();
}
