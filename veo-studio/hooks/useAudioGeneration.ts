/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {useState, useCallback} from 'react';
import {generateAudioFromText} from '../services/geminiService';
import ApiKeyManager from '../services/apiKeyManager';
import {ScriptEntry} from '../types';

export interface AudioData {
  url: string;
  blob: Blob;
  error?: string;
  isLoading?: boolean;
  retryAfter?: number;
}

interface UseAudioGenerationProps {
  apiKeyManager: ApiKeyManager;
  script: ScriptEntry[] | null;
  language: 'english' | 'vietnamese';
  voice: 'male' | 'female';
}

/**
 * Hook để xử lý audio generation với auto key rotation
 */
export const useAudioGeneration = ({
  apiKeyManager,
  script,
  language,
  voice,
}: UseAudioGenerationProps) => {
  const [audioData, setAudioData] = useState<Array<AudioData | null>>([]);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  /**
   * Parse rate limit error và trả về retry seconds
   */
  const parseRateLimitError = (error: unknown): {
    isRateLimit: boolean;
    retryAfterSeconds: number;
    errorMsg: string;
  } => {
    if (!(error instanceof Error)) {
      return {isRateLimit: false, retryAfterSeconds: 0, errorMsg: String(error)};
    }

    try {
      const errorJson = JSON.parse(error.message);
      if (errorJson.error?.code === 429) {
        const retryDelay = errorJson.error.details?.find(
          (d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
        )?.retryDelay;

        if (retryDelay) {
          const retryAfterSeconds = parseInt(retryDelay.replace('s', ''));
          return {
            isRateLimit: true,
            retryAfterSeconds,
            errorMsg: `Rate limit exceeded`,
          };
        }
      }
      return {
        isRateLimit: false,
        retryAfterSeconds: 0,
        errorMsg: errorJson.error?.message || error.message,
      };
    } catch {
      return {isRateLimit: false, retryAfterSeconds: 0, errorMsg: error.message};
    }
  };

  /**
   * Generate audio cho 1 clip với auto retry và key rotation
   */
  const generateSingleAudio = async (
    text: string,
    maxRetries = 2
  ): Promise<Blob> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const currentKey = apiKeyManager.getCurrentKey();
        const audioBlob = await generateAudioFromText(text, language, voice, currentKey);
        return audioBlob;
      } catch (error) {
        const {isRateLimit, retryAfterSeconds} = parseRateLimitError(error);

        if (isRateLimit) {
          apiKeyManager.markRateLimited(retryAfterSeconds);

          // Thử rotate sang key khác
          if (apiKeyManager.getTotalKeys() > 1 && apiKeyManager.hasAvailableKey()) {
            apiKeyManager.rotateToNextKey();
            console.log(`🔄 Retrying with rotated key (attempt ${attempt + 1}/${maxRetries + 1})`);
            await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay
            continue; // Retry ngay với key mới
          } else {
            // Tất cả keys đều bị rate limit
            if (attempt < maxRetries) {
              const waitTime = Math.min(retryAfterSeconds, 10); // Max wait 10s mỗi lần
              console.log(`⏱️ All keys rate limited. Waiting ${waitTime}s...`);
              await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
              continue;
            }
          }
        }

        // Nếu không phải rate limit hoặc đã hết retries, throw error
        throw error;
      }
    }

    throw new Error('Max retries exceeded');
  };

  /**
   * Generate tất cả audio clips
   */
  const handleGenerateAllAudio = useCallback(async () => {
    if (!script) return;

    setIsLoadingAudio(true);

    // Initialize với loading state
    const initialAudioData: Array<AudioData | null> = script.map((entry) =>
      entry.text.trim() ? {url: '', blob: new Blob(), isLoading: true} : null
    );
    setAudioData(initialAudioData);

    try {
      for (let i = 0; i < script.length; i++) {
        const entry = script[i];
        if (!entry.text.trim()) continue;

        try {
          const audioBlob = await generateSingleAudio(entry.text);
          const audioUrl = URL.createObjectURL(audioBlob);

          setAudioData((prev) => {
            const updated = [...prev];
            updated[i] = {url: audioUrl, blob: audioBlob};
            return updated;
          });

          // Delay nhỏ giữa các requests (vì đã có auto rotation)
          if (i < script.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (clipError) {
          console.error(`Failed to generate audio for clip ${i}:`, clipError);
          const {errorMsg, retryAfterSeconds} = parseRateLimitError(clipError);

          setAudioData((prev) => {
            const updated = [...prev];
            updated[i] = {
              url: '',
              blob: new Blob(),
              error: errorMsg,
              retryAfter: retryAfterSeconds > 0 ? Date.now() + retryAfterSeconds * 1000 : undefined,
            };
            return updated;
          });
        }
      }
    } finally {
      setIsLoadingAudio(false);
      apiKeyManager.logStatus(); // Log final status
    }
  }, [script, language, voice, apiKeyManager]);

  /**
   * Retry 1 audio clip cụ thể
   */
  const retryAudioClip = useCallback(
    async (index: number) => {
      if (!script || !script[index]) return;

      const entry = script[index];
      if (!entry.text.trim()) return;

      // Set loading state
      setAudioData((prev) => {
        const updated = [...prev];
        updated[index] = {url: '', blob: new Blob(), isLoading: true};
        return updated;
      });

      try {
        const audioBlob = await generateSingleAudio(entry.text);
        const audioUrl = URL.createObjectURL(audioBlob);

        setAudioData((prev) => {
          const updated = [...prev];
          updated[index] = {url: audioUrl, blob: audioBlob};
          return updated;
        });
      } catch (clipError) {
        console.error(`Failed to retry audio for clip ${index}:`, clipError);
        const {errorMsg, retryAfterSeconds} = parseRateLimitError(clipError);

        setAudioData((prev) => {
          const updated = [...prev];
          updated[index] = {
            url: '',
            blob: new Blob(),
            error: errorMsg,
            retryAfter: retryAfterSeconds > 0 ? Date.now() + retryAfterSeconds * 1000 : undefined,
          };
          return updated;
        });
      }
    },
    [script, language, voice, apiKeyManager]
  );

  return {
    audioData,
    isLoadingAudio,
    handleGenerateAllAudio,
    retryAudioClip,
  };
};
