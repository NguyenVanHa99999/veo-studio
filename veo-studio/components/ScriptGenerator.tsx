/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {LoaderCircleIcon} from './icons';

interface ScriptGeneratorProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  language: 'english' | 'vietnamese';
  onLanguageChange: (value: 'english' | 'vietnamese') => void;
  isLoading: boolean;
  onGenerate: () => void;
}

/**
 * Component để generate script từ video
 */
const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  prompt,
  onPromptChange,
  language,
  onLanguageChange,
  isLoading,
  onGenerate,
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-gray-300">2. Generate Script</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="e.g., 'Create a voiceover script for this cooking tutorial. Make it sound enthusiastic and easy to follow.'"
          className="md:col-span-2 w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-base text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          rows={4}
        />
        <div>
          <label className="text-xs block mb-1.5 font-medium text-gray-400">
            Language
          </label>
          <select
            value={language}
            onChange={(e) =>
              onLanguageChange(e.target.value as 'english' | 'vietnamese')
            }
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="english">English</option>
            <option value="vietnamese">Tiếng Việt</option>
          </select>
        </div>
      </div>
      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-lg disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <LoaderCircleIcon className="w-6 h-6 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Script'
        )}
      </button>
    </div>
  );
};

export default ScriptGenerator;
