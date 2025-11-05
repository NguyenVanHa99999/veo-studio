/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {useState, useMemo} from 'react';
import ApiKeyManager from '../services/apiKeyManager';

/**
 * Hook để quản lý API Key Manager
 * Khởi tạo manager với keys từ environment
 */
export const useApiKeyManager = () => {
  const apiKeyManager = useMemo(() => {
    const apiKeysString = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
    
    // Support multiple keys cách nhau bởi dấu phẩy
    const apiKeys = apiKeysString
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (apiKeys.length === 0) {
      console.warn('⚠️ No API keys found. Please set GEMINI_API_KEY in .env.local');
      return new ApiKeyManager(['']);
    }

    console.log(`🚀 Loaded ${apiKeys.length} API key(s) for rotation`);
    return new ApiKeyManager(apiKeys);
  }, []);

  return apiKeyManager;
};
