/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, {useCallback, useState} from 'react';
import VideoUpload from './components/VideoUpload';
import ScriptGenerator from './components/ScriptGenerator';
import AudioResults from './components/AudioResults';
import {generateScriptFromVideo} from './services/geminiService';
import {useApiKeyManager} from './hooks/useApiKeyManager';
import {useAudioGeneration} from './hooks/useAudioGeneration';
import {ScriptEntry} from './types';

/**
 * Main App Component
 * Refactored để support 19 API keys với auto rotation
 */
const App: React.FC = () => {
  // API Key Manager (auto load 19 keys từ .env.local)
  const apiKeyManager = useApiKeyManager();
  // State management
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [script, setScript] = useState<ScriptEntry[] | null>(null);
  const [language, setLanguage] = useState<'english' | 'vietnamese'>('english');
  const [voice, setVoice] = useState<'male' | 'female'>('male');
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio generation với auto key rotation
  const {
    audioData,
    isLoadingAudio,
    handleGenerateAllAudio,
    retryAudioClip,
  } = useAudioGeneration({apiKeyManager, script, language, voice});

  // Error handler
  const handleError = (message: string, error?: unknown) => {
    console.error(message, error);
    const err = error instanceof Error ? error.message : String(error);
    setErrorMessage(`${message}: ${err}`);
  };

  // Video upload handler
  const handleVideoUpload = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        setScript(null);
        setErrorMessage(null);
      } else {
        setErrorMessage('Please upload a valid video file.');
      }
    }
  }, []);

  // Remove video handler
  const handleRemoveVideo = useCallback(() => {
    setVideoUrl(null);
    setVideoFile(null);
    setScript(null);
  }, []);

  // Generate script handler (sử dụng key rotation)
  const handleGenerateScript = useCallback(async () => {
    if (!videoFile) return;

    setIsLoadingScript(true);
    setErrorMessage(null);
    setScript(null);

    try {
      const currentKey = apiKeyManager.getCurrentKey();
      const generatedScript = await generateScriptFromVideo(
        videoFile,
        prompt,
        language,
        currentKey,
      );
      setScript(generatedScript);
      console.log(`✅ Script generated successfully with ${generatedScript.length} entries`);
    } catch (error) {
      handleError('Failed to generate script', error);
    } finally {
      setIsLoadingScript(false);
    }
  }, [videoFile, prompt, language, apiKeyManager]);

  // Download handlers
  const handleDownloadScript = useCallback(() => {
    if (!script) return;
    const formattedScript = script
      .map((s) => `[${s.timestamp}]\n${s.text}`)
      .join('\n\n');
    const blob = new Blob([formattedScript], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video_script.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [script]);

  const handleDownloadAudioClip = useCallback(
    (index: number) => {
      const audioClip = audioData[index];
      if (!audioClip || !audioClip.url) return;
      const a = document.createElement('a');
      a.href = audioClip.url;
      a.download = `voiceover_clip_${index + 1}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    [audioData]
  );

  // Render
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col font-sans">
      <header className="py-6 flex justify-center items-center px-8 relative z-10">
        <h1 className="text-5xl font-semibold tracking-wide text-center bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Video Content AI
          <span className="block text-xs mt-2 text-gray-400 font-normal">
            🔑 {apiKeyManager.getTotalKeys()} API Keys Active | Auto-Rotation Enabled
          </span>
        </h1>
      </header>

      <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col p-4 space-y-8">
        {/* Step 1: Video Upload */}
        <VideoUpload
          videoUrl={videoUrl}
          onVideoUpload={handleVideoUpload}
          onRemoveVideo={handleRemoveVideo}
        />

        {/* Step 2: Generate Script */}
        {videoUrl && (
          <ScriptGenerator
            prompt={prompt}
            onPromptChange={setPrompt}
            language={language}
            onLanguageChange={setLanguage}
            isLoading={isLoadingScript}
            onGenerate={handleGenerateScript}
          />
        )}

        {/* Step 3: Results */}
        {(isLoadingScript || script || errorMessage) && (
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            {errorMessage && (
              <div className="text-center bg-red-900/20 border border-red-500 p-4 rounded-lg mb-4">
                <p className="text-red-300">{errorMessage}</p>
              </div>
            )}
            {script && (
              <AudioResults
                script={script}
                audioData={audioData}
                voice={voice}
                onVoiceChange={setVoice}
                isLoadingAudio={isLoadingAudio}
                onGenerateAudio={handleGenerateAllAudio}
                onRetryClip={retryAudioClip}
                onDownloadScript={handleDownloadScript}
                onDownloadClip={handleDownloadAudioClip}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
