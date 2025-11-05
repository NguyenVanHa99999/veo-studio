/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, {useState, useEffect} from 'react';
import {ScriptEntry} from '../types';
import {AudioData} from '../hooks/useAudioGeneration';
import {DownloadIcon, LoaderCircleIcon, Volume2Icon} from './icons';

interface AudioResultsProps {
  script: ScriptEntry[];
  audioData: Array<AudioData | null>;
  voice: 'male' | 'female';
  onVoiceChange: (voice: 'male' | 'female') => void;
  isLoadingAudio: boolean;
  onGenerateAudio: () => void;
  onRetryClip: (index: number) => void;
  onDownloadScript: () => void;
  onDownloadClip: (index: number) => void;
}

/**
 * Countdown timer cho retry
 */
const RetryCountdown: React.FC<{retryAfter: number; onRetry: () => void}> = ({
  retryAfter,
  onRetry,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.ceil((retryAfter - Date.now()) / 1000);
      if (remaining <= 0) {
        setSecondsLeft(0);
        setTimeout(() => onRetry(), 100);
      } else {
        setSecondsLeft(remaining);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [retryAfter, onRetry]);

  if (secondsLeft <= 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-indigo-400">
        <LoaderCircleIcon className="w-5 h-5 animate-spin" />
        <span className="text-sm">Auto-retrying...</span>
      </div>
    );
  }

  return (
    <div className="bg-yellow-900/20 border border-yellow-500/50 rounded p-3">
      <p className="text-yellow-300 text-sm mb-2 text-center">
        ⏳ Rate limit. Auto-retry in <strong>{secondsLeft}s</strong>
      </p>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
          style={{width: `${Math.max(0, 100 - (secondsLeft / 35) * 100)}%`}}
        />
      </div>
    </div>
  );
};

/**
 * Component hiển thị script & audio results
 */
const AudioResults: React.FC<AudioResultsProps> = ({
  script,
  audioData,
  voice,
  onVoiceChange,
  isLoadingAudio,
  onGenerateAudio,
  onRetryClip,
  onDownloadScript,
  onDownloadClip,
}) => {
  // Stats
  const successCount = audioData.filter(
    (a) => a && a.url && !a.error && !a.isLoading
  ).length;
  const errorCount = audioData.filter((a) => a && a.error).length;
  const totalNonEmpty = audioData.filter((a) => a !== null).length;

  return (
    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-gray-300">3. Results</h2>

      <div className="space-y-6">
        {/* Script Display */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Generated Script &amp; Audio</h3>
            <button
              onClick={onDownloadScript}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm font-semibold rounded-lg transition-colors">
              <DownloadIcon className="w-4 h-4" />
              Download Script (.txt)
            </button>
          </div>

          {/* Status Summary */}
          {!isLoadingAudio && totalNonEmpty > 0 && (
            <div className="mb-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Audio Generation Status:</span>
                <div className="flex gap-3">
                  <span className="text-green-400">✓ {successCount} success</span>
                  {errorCount > 0 && (
                    <span className="text-red-400">✗ {errorCount} failed</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-4">
            {script.map((entry, index) => (
              <div key={index} className="p-3 bg-gray-800/60 rounded-md">
                <p className="font-mono text-sm text-indigo-300">{entry.timestamp}</p>
                <p className="text-gray-300 mt-1">{entry.text}</p>

                {/* Audio Player / Loading / Error */}
                {audioData[index] && (
                  <div className="mt-3 border-t border-gray-700 pt-3">
                    {audioData[index]?.isLoading ? (
                      <div className="flex items-center justify-center gap-2 py-3 text-indigo-400">
                        <LoaderCircleIcon className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Generating audio...</span>
                      </div>
                    ) : audioData[index]?.error ? (
                      audioData[index]?.retryAfter &&
                      audioData[index]!.retryAfter! > Date.now() ? (
                        <RetryCountdown
                          retryAfter={audioData[index]!.retryAfter!}
                          onRetry={() => onRetryClip(index)}
                        />
                      ) : (
                        <div className="bg-red-900/20 border border-red-500/50 rounded p-3">
                          <p className="text-red-300 text-sm mb-2">
                            ❌ {audioData[index]?.error}
                          </p>
                          <button
                            onClick={() => onRetryClip(index)}
                            className="w-full flex items-center justify-center gap-1.5 text-xs py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium">
                            <LoaderCircleIcon className="w-3 h-3" />
                            Retry Audio Generation
                          </button>
                        </div>
                      )
                    ) : audioData[index]?.url ? (
                      <>
                        <audio
                          controls
                          src={audioData[index]?.url}
                          className="w-full h-10"
                        />
                        <button
                          onClick={() => onDownloadClip(index)}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs py-1 bg-gray-700 hover:bg-gray-600 rounded">
                          <DownloadIcon className="w-3 h-3" />
                          Download Clip
                        </button>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Audio Generation Controls */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Generate Voiceover</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1">
              <label className="text-xs block mb-1.5 font-medium text-gray-400">
                Voice
              </label>
              <select
                value={voice}
                onChange={(e) => onVoiceChange(e.target.value as 'male' | 'female')}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <button
            onClick={onGenerateAudio}
            disabled={isLoadingAudio}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-lg disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isLoadingAudio ? (
              <>
                <LoaderCircleIcon className="w-6 h-6 animate-spin" />
                Generating All Audio Clips...
              </>
            ) : (
              <>
                <Volume2Icon className="w-6 h-6" /> Generate Audio
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioResults;
