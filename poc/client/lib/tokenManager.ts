import { refreshAccessToken } from './api';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class TokenManager {
  private static instance: TokenManager;
  private tokenData: TokenData | null = null;
  private refreshPromise: Promise<string> | null = null;

  private constructor() {
    this.loadTokensFromStorage();
    this.setupAutoRefresh();
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Store tokens securely
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: string): void {
    const expiresAt = Date.now() + this.parseExpiry(expiresIn);
    
    this.tokenData = {
      accessToken,
      refreshToken,
      expiresAt
    };

    this.saveTokensToStorage();
  }

  /**
   * Get current access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.tokenData) {
      return null;
    }

    // Check if token is expired or will expire soon (within 5 minutes)
    const now = Date.now();
    const expiresSoon = this.tokenData.expiresAt - now < 5 * 60 * 1000;

    if (expiresSoon) {
      return this.refreshTokens();
    }

    return this.tokenData.accessToken;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshTokens(): Promise<string | null> {
    if (!this.tokenData?.refreshToken) {
      this.clearTokens();
      return null;
    }

    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return null;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<string> {
    if (!this.tokenData?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await refreshAccessToken(this.tokenData.refreshToken);
      
      if (response.success && response.accessToken) {
        // Update tokens with new access token
        this.tokenData.accessToken = response.accessToken;
        this.tokenData.expiresAt = Date.now() + this.parseExpiry(response.expiresIn || '24h');
        this.saveTokensToStorage();
        
        return response.accessToken;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    this.tokenData = null;
    this.removeTokensFromStorage();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.tokenData !== null && this.tokenData.expiresAt > Date.now();
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(): Date | null {
    return this.tokenData ? new Date(this.tokenData.expiresAt) : null;
  }

  /**
   * Parse expiry string to milliseconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 24 * 60 * 60 * 1000; // Default to 24 hours
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Save tokens to secure storage
   */
  private saveTokensToStorage(): void {
    if (!this.tokenData) {
      return;
    }

    try {
      // Use sessionStorage for better security (cleared when browser closes)
      sessionStorage.setItem('rails_tokens', JSON.stringify(this.tokenData));
    } catch (error) {
      console.error('Failed to save tokens to storage:', error);
    }
  }

  /**
   * Load tokens from storage
   */
  private loadTokensFromStorage(): void {
    try {
      const stored = sessionStorage.getItem('rails_tokens');
      if (stored) {
        this.tokenData = JSON.parse(stored);
        
        // Check if tokens are expired
        if (this.tokenData && this.tokenData.expiresAt < Date.now()) {
          this.clearTokens();
        }
      }
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
      this.clearTokens();
    }
  }

  /**
   * Remove tokens from storage
   */
  private removeTokensFromStorage(): void {
    try {
      sessionStorage.removeItem('rails_tokens');
    } catch (error) {
      console.error('Failed to remove tokens from storage:', error);
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupAutoRefresh(): void {
    // Check token expiration every minute
    setInterval(() => {
      if (this.tokenData && this.tokenData.expiresAt - Date.now() < 5 * 60 * 1000) {
        // Token expires within 5 minutes, refresh it
        this.refreshTokens().catch(error => {
          console.error('Auto-refresh failed:', error);
        });
      }
    }, 60 * 1000);
  }

  /**
   * Logout and clear all tokens
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if we have a valid token
      const accessToken = await this.getAccessToken();
      if (accessToken) {
        await fetch('/api/banks/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearTokens();
    }
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();

// Export types
export type { TokenData }; 