/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface KeyStatus {
  key: string;
  availableAt: number; // Timestamp khi key available lại
  isBlocked: boolean; // Key bị block vĩnh viễn (invalid)
  errorCount: number; // Số lần bị lỗi
}

/**
 * Quản lý multiple API keys và auto rotation
 * Hỗ trợ tối đa unlimited keys
 */
class ApiKeyManager {
  private keys: KeyStatus[] = [];
  private currentIndex = 0;

  constructor(apiKeys: string[]) {
    this.keys = apiKeys.map((key) => ({
      key,
      availableAt: 0,
      isBlocked: false,
      errorCount: 0,
    }));

    console.log(`🔑 ApiKeyManager initialized with ${this.keys.length} key(s)`);
  }

  /**
   * Lấy key hiện tại đang active
   */
  getCurrentKey(): string {
    const now = Date.now();

    // Tìm key available
    const availableKey = this.keys.find(
      (k) => !k.isBlocked && k.availableAt <= now
    );

    if (availableKey) {
      this.currentIndex = this.keys.indexOf(availableKey);
      return availableKey.key;
    }

    // Nếu không có key available, return key sẽ available sớm nhất
    const soonestKey = this.keys
      .filter((k) => !k.isBlocked)
      .reduce((prev, curr) => (curr.availableAt < prev.availableAt ? curr : prev));

    this.currentIndex = this.keys.indexOf(soonestKey);
    return soonestKey.key;
  }

  /**
   * Mark key bị rate limited
   * @param keyString - API key string để tìm đúng key cần mark
   * @param retryAfterSeconds - Số giây đến khi key available lại
   */
  markRateLimited(keyString: string, retryAfterSeconds: number): void {
    // Tìm key index dựa trên key string (so sánh 20 ký tự đầu)
    const keyIndex = this.keys.findIndex((k) => k.key.substring(0, 20) === keyString.substring(0, 20));
    
    if (keyIndex === -1) {
      console.warn('⚠️ Key not found for rate limit marking');
      return;
    }
    
    const key = this.keys[keyIndex];
    key.availableAt = Date.now() + retryAfterSeconds * 1000;
    key.errorCount++;
    console.log(
      `⏳ Key ${keyIndex + 1}/${this.keys.length} rate limited. Available in ${retryAfterSeconds}s`
    );
  }

  /**
   * Rotate sang key tiếp theo có thể dùng được
   */
  rotateToNextKey(): string {
    const now = Date.now();
    const startIndex = this.currentIndex;

    // Thử tìm key available tiếp theo
    for (let i = 1; i <= this.keys.length; i++) {
      const nextIndex = (startIndex + i) % this.keys.length;
      const key = this.keys[nextIndex];

      if (!key.isBlocked && key.availableAt <= now) {
        this.currentIndex = nextIndex;
        console.log(
          `🔄 Rotated to Key ${nextIndex + 1}/${this.keys.length} (${this.getAvailableKeyCount()} keys available)`
        );
        return key.key;
      }
    }

    // Không có key available, return current
    return this.keys[this.currentIndex].key;
  }

  /**
   * Check xem có key nào available không
   */
  hasAvailableKey(): boolean {
    const now = Date.now();
    return this.keys.some((k) => !k.isBlocked && k.availableAt <= now);
  }

  /**
   * Lấy số giây đến khi có key available tiếp theo
   */
  getSecondsUntilNextAvailable(): number {
    const now = Date.now();
    const blockedKeys = this.keys
      .filter((k) => !k.isBlocked && k.availableAt > now);

    if (blockedKeys.length === 0) return 0;

    const soonest = blockedKeys.reduce((prev, curr) =>
      curr.availableAt < prev.availableAt ? curr : prev
    );

    return Math.ceil((soonest.availableAt - now) / 1000);
  }

  /**
   * Get tổng số keys
   */
  getTotalKeys(): number {
    return this.keys.length;
  }

  /**
   * Get số lượng keys đang available
   */
  getAvailableKeyCount(): number {
    const now = Date.now();
    return this.keys.filter((k) => !k.isBlocked && k.availableAt <= now).length;
  }

  /**
   * Get thông tin status của tất cả keys
   */
  getKeysStatus(): Array<{
    index: number;
    available: boolean;
    availableIn: number;
    errorCount: number;
    isBlocked: boolean;
  }> {
    const now = Date.now();
    return this.keys.map((k, i) => ({
      index: i + 1,
      available: !k.isBlocked && k.availableAt <= now,
      availableIn: Math.max(0, Math.ceil((k.availableAt - now) / 1000)),
      errorCount: k.errorCount,
      isBlocked: k.isBlocked,
    }));
  }

  /**
   * Mark key là invalid (block vĩnh viễn)
   */
  markKeyInvalid(keyIndex?: number): void {
    const index = keyIndex ?? this.currentIndex;
    const key = this.keys[index];
    if (key) {
      key.isBlocked = true;
      console.warn(`❌ Key ${index + 1}/${this.keys.length} marked as invalid/blocked`);
    }
  }

  /**
   * Reset error count cho tất cả keys
   */
  resetErrorCounts(): void {
    this.keys.forEach((k) => {
      k.errorCount = 0;
    });
    console.log('✅ Reset error counts for all keys');
  }

  /**
   * Log status summary
   */
  logStatus(): void {
    const available = this.getAvailableKeyCount();
    const total = this.getTotalKeys();
    const blocked = this.keys.filter((k) => k.isBlocked).length;

    console.log(`
📊 API Keys Status:
   Total: ${total} keys
   Available: ${available} keys
   Rate-limited: ${total - available - blocked} keys
   Blocked/Invalid: ${blocked} keys
   Current: Key ${this.currentIndex + 1}
    `);
  }
}

export default ApiKeyManager;
