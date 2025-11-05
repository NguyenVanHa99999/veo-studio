/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, {useCallback, useEffect, useState} from 'react';
import ApiKeyDialog from './components/ApiKeyDialog';
import {
  DownloadIcon,
  FileTextIcon,
  LoaderCircleIcon,
  UploadCloudIcon,
  Volume2Icon,
  XMarkIcon,
} from './components/icons';
import {
  generateAudioFromText,
  generateScriptFromVideo,
} from './services/geminiService';
import {ScriptEntry} from './types';

interface AudioData {
  url: string;
  blob: Blob;
}

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [script, setScript] = useState<ScriptEntry[] | null>(null);
  const [audioData, setAudioData] = useState<Array<AudioData | null>>([]);
  const [language, setLanguage] = useState<'english' | 'vietnamese'>(
    'english',
  );
  const [voice, setVoice] = useState<'male' | 'female'>('male');
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          if (!(await window.aistudio.hasSelectedApiKey())) {
            setShowApiKeyDialog(true);
          }
        } catch (error) {
          console.warn(
            'aistudio.hasSelectedApiKey check failed, assuming no key selected.',
            error,
          );
          setShowApiKeyDialog(true);
        }
      }
    };
    checkApiKey();
  }, []);

  const handleApiKeyDialogContinue = async () => {
    setShowApiKeyDialog(false);
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
  };

  const handleError = (message: string, error?: unknown) => {
    console.error(message, error);
    const err = error instanceof Error ? error.message : String(error);

    let userFriendlyMessage = `${message}: ${err}`;
    let shouldOpenDialog = false;

    if (
      err.includes('API_KEY_INVALID') ||
      err.includes('API key not valid') ||
      err.toLowerCase().includes('permission denied') ||
      err.includes('Requested entity was not found.')
    ) {
      userFriendlyMessage =
        'Your API key is invalid or lacks permissions. Please select a valid, billing-enabled API key.';
      shouldOpenDialog = true;
    }
    setErrorMessage(userFriendlyMessage);
    if (shouldOpenDialog) setShowApiKeyDialog(true);
  };

  const handleVideoUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        setScript(null);
        setAudioData([]);
        setErrorMessage(null);
      } else {
        setErrorMessage('Please upload a valid video file.');
      }
    }
  };

  const handleGenerateScript = useCallback(async () => {
    if (!videoFile) return;

    setIsLoadingScript(true);
    setErrorMessage(null);
    setScript(null);
    setAudioData([]);

    try {
      const generatedScript = await generateScriptFromVideo(
        videoFile,
        prompt,
        language,
      );
      setScript(generatedScript);
    } catch (error) {
      handleError('Failed to generate script', error);
    } finally {
      setIsLoadingScript(false);
    }
  }, [videoFile, prompt, language]);

  const handleGenerateAudio = useCallback(async () => {
    if (!script) return;
    setIsLoadingAudio(true);
    setErrorMessage(null);

    const newAudioData: Array<AudioData | null> = new Array(
      script.length,
    ).fill(null);

    try {
      for (let i = 0; i < script.length; i++) {
        const entry = script[i];
        if (!entry.text.trim()) {
          continue; // Skip empty text entries
        }
        try {
          const audioBlob = await generateAudioFromText(
            entry.text,
            language,
            voice,
          );
          const audioUrl = URL.createObjectURL(audioBlob);
          newAudioData[i] = {url: audioUrl, blob: audioBlob};
        } catch (clipError) {
          console.error(`Failed to generate audio for clip ${i}:`, clipError);
          // We'll leave the entry as null and continue
        }
      }
      setAudioData(newAudioData);
    } catch (error) {
      handleError(
        'An unexpected error occurred during audio generation',
        error,
      );
    } finally {
      setIsLoadingAudio(false);
    }
  }, [script, language, voice]);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadScript = () => {
    if (!script) return;
    const formattedScript = script
      .map((s) => `[${s.timestamp}]\n${s.text}`)
      .join('\n\n');
    const blob = new Blob([formattedScript], {type: 'text/plain'});
    downloadFile(blob, 'video_script.txt');
  };

  const handleDownloadAudioClip = (index: number) => {
    const audioClip = audioData[index];
    if (!audioClip) return;
    downloadFile(audioClip.blob, `voiceover_clip_${index + 1}.wav`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col font-sans">
      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />
      )}
      <header className="py-6 flex justify-center items-center px-8 relative z-10">
        <h1 className="text-5xl font-semibold tracking-wide text-center bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Video Content AI
        </h1>
      </header>
      <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col p-4 space-y-8">
        {/* Step 1: Video Upload */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-gray-300">
            1. Upload Your Video
          </h2>
          {videoUrl ? (
            <div className="flex flex-col items-center">
              <video
                src={videoUrl}
                controls
                className="w-full max-w-md rounded-lg"
              />
              <button
                onClick={() => setVideoUrl(null)}
                className="mt-4 text-sm text-red-400 hover:text-red-300 flex items-center gap-1">
                <XMarkIcon className="w-4 h-4" /> Remove Video
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloudIcon className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    MP4, MOV, AVI, etc.
                  </p>
                </div>
                <input
                  id="dropzone-file"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleVideoUpload(e.target.files)}
                />
              </label>
            </div>
          )}
        </div>

        {/* Step 2: Generate Script */}
        {videoUrl && (
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-gray-300">
              2. Generate Script
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
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
                    setLanguage(e.target.value as 'english' | 'vietnamese')
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="english">English</option>
                  <option value="vietnamese">Tiếng Việt</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleGenerateScript}
              disabled={isLoadingScript}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-lg disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoadingScript ? (
                <>
                  <LoaderCircleIcon className="w-6 h-6 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Script'
              )}
            </button>
          </div>
        )}

        {/* Step 3: Results */}
        {(isLoadingScript || script || errorMessage) && (
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-gray-300">
              3. Results
            </h2>
            {errorMessage && (
              <div className="text-center bg-red-900/20 border border-red-500 p-4 rounded-lg">
                <p className="text-red-300">{errorMessage}</p>
              </div>
            )}
            {script && (
              <div className="space-y-6">
                {/* Script Display */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">
                      Generated Script &amp; Audio
                    </h3>
                    <button
                      onClick={handleDownloadScript}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm font-semibold rounded-lg transition-colors">
                      <DownloadIcon className="w-4 h-4" />
                      Download Script (.txt)
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-4">
                    {script.map((entry, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-800/60 rounded-md">
                        <p className="font-mono text-sm text-indigo-300">
                          {entry.timestamp}
                        </p>
                        <p className="text-gray-300 mt-1">{entry.text}</p>
                        {audioData[index] && (
                          <div className="mt-3 border-t border-gray-700 pt-3">
                            <audio
                              controls
                              src={audioData[index]?.url}
                              className="w-full h-10"
                            />
                            <button
                              onClick={() => handleDownloadAudioClip(index)}
                              className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs py-1 bg-gray-700 hover:bg-gray-600 rounded">
                              <DownloadIcon className="w-3 h-3" />
                              Download Clip
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audio Generation Controls */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Generate Voiceover
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-1">
                      <label className="text-xs block mb-1.5 font-medium text-gray-400">
                        Voice
                      </label>
                      <select
                        value={voice}
                        onChange={(e) =>
                          setVoice(e.target.value as 'male' | 'female')
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateAudio}
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
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
