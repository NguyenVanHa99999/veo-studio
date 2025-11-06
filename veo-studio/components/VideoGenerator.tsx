/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AI Video Generator Component (Simple UI - No API calls)
 * Chờ có local model rồi kết nối vào đây
 * UI độc lập, không ảnh hưởng tính năng cũ
 */

import {useState} from 'react';
import {VideoGeneratorConfig} from '../types';

export function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [config, setConfig] = useState<VideoGeneratorConfig>({
    duration: '45s',
    aspectRatio: '9:16',
    style: 'realistic',
  });

  const handleGenerate = () => {
    // TODO: Kết nối với local model khi có
    console.log('🎬 Video generation với local model (coming soon)');
    console.log('📝 Prompt:', prompt);
    console.log('⚙️ Config:', config);
    alert('Tính năng đang chờ local model. UI đã sẵn sàng!');
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          🎬 AI Video Generator
        </h2>
        <p className="text-gray-400 text-sm">
          Create viral shorts (Waiting for local model)
        </p>
      </div>

      {/* Prompt Input */}
      <div className="mb-4">
        <label className="block text-white mb-2 font-medium">
          📝 Video Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your video idea...&#10;&#10;Examples:&#10;• A person doing parkour jumps between buildings&#10;• Soccer player scoring an amazing goal&#10;• Chef cooking pasta in restaurant kitchen"
          className="w-full h-32 bg-gray-700 text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Settings */}
      <div className="mb-4 space-y-3">
        <label className="block text-white font-medium">⚙️ Settings</label>

        {/* Duration */}
        <div>
          <label className="block text-gray-300 text-sm mb-2">Duration</label>
          <div className="flex gap-2">
            {['30s', '45s', '60s'].map((dur) => (
              <button
                key={dur}
                onClick={() =>
                  setConfig({
                    ...config,
                    duration: dur as VideoGeneratorConfig['duration'],
                  })
                }
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  config.duration === dur
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {dur}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="block text-gray-300 text-sm mb-2">Style</label>
          <select
            value={config.style}
            onChange={(e) =>
              setConfig({
                ...config,
                style: e.target.value as VideoGeneratorConfig['style'],
              })
            }
            className="w-full bg-gray-700 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="realistic">Realistic</option>
            <option value="cinematic">Cinematic</option>
            <option value="animated">Animated</option>
          </select>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="block text-gray-300 text-sm mb-2">Aspect Ratio</label>
          <div className="flex gap-2">
            {['9:16', '16:9', '1:1'].map((ratio) => (
              <button
                key={ratio}
                onClick={() =>
                  setConfig({
                    ...config,
                    aspectRatio: ratio as VideoGeneratorConfig['aspectRatio'],
                  })
                }
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  config.aspectRatio === ratio
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim()}
        className={`w-full py-3 rounded-lg font-bold text-white mb-4 transition-colors ${
          !prompt.trim()
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        🎬 Generate Video (Coming Soon)
      </button>

      {/* Info Message */}
      <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
        <p className="text-yellow-200 text-sm">
          ⏳ Waiting for local model integration...
        </p>
      </div>

      {/* Separator */}
      <div className="border-t border-gray-700 my-4"></div>

      {/* Video Preview Placeholder */}
      <div className="flex-1 flex flex-col">
        <label className="block text-white font-medium mb-3">
          📹 Generated Video
        </label>

        <div className="flex-1 bg-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-2">📹</p>
            <p className="text-gray-500 text-sm">
              Video will appear here when local model is ready
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-500 text-xs text-center">
          UI ready • Waiting for local model integration
        </p>
      </div>
    </div>
  );
}
