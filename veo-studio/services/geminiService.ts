/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  GoogleGenAI,
  Modality,
  GenerateContentResponse,
  Type,
} from '@google/genai';
import {ScriptEntry} from '../types';

const MAX_FRAMES = 30;
const FRAME_EXTRACT_INTERVAL_S = 1;

async function extractFramesFromVideo(
  videoFile: File,
): Promise<{base64Frames: string[]; duration: number}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: string[] = [];

    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      const interval =
        duration > MAX_FRAMES * FRAME_EXTRACT_INTERVAL_S
          ? duration / MAX_FRAMES
          : FRAME_EXTRACT_INTERVAL_S;
      let currentTime = 0;
      let frameCount = 0;

      const captureFrame = () => {
        if (currentTime >= duration || frameCount >= MAX_FRAMES) {
          URL.revokeObjectURL(video.src);
          resolve({base64Frames: frames, duration});
          return;
        }

        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        if (!ctx) {
          reject('Canvas context is not available');
          return;
        }
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
        frames.push(base64);
        currentTime += interval;
        frameCount++;
        captureFrame();
      };

      video.onerror = (e) => {
        reject(new Error('Error processing video file.'));
      };

      captureFrame();
    };
  });
}

export const generateScriptFromVideo = async (
  videoFile: File,
  prompt: string,
  language: 'english' | 'vietnamese',
  apiKey?: string,
): Promise<ScriptEntry[]> => {
  const ai = new GoogleGenAI({apiKey: apiKey || process.env.API_KEY});

  const {base64Frames, duration} = await extractFramesFromVideo(videoFile);

  const imageParts = base64Frames.map((frame) => ({
    inlineData: {
      data: frame,
      mimeType: 'image/jpeg',
    },
  }));

  const languageInstruction =
    language === 'vietnamese' ? 'in Vietnamese' : 'in English';
  const systemInstruction = `You are an expert scriptwriter. Analyze the provided sequence of video frames and generate a voiceover script ${languageInstruction}. The video is approximately ${Math.round(
    duration,
  )} seconds long. The user's instructions for the script are: "${prompt}". Create a script that is well-paced for the video's length. Each part of the script should have a timestamp and the corresponding text.`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          text: 'Analyze these frames and create a script based on the system instructions.',
        },
        ...imageParts,
      ],
    },
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            timestamp: {
              type: Type.STRING,
              description:
                'The time range in the video for this script part, e.g., "00:00-00:05".',
            },
            text: {
              type: Type.STRING,
              description: 'The voiceover text for this part of the video.',
            },
          },
          required: ['timestamp', 'text'],
        },
      },
    },
  });

  try {
    const jsonText = response.text.trim();
    const script = JSON.parse(jsonText) as ScriptEntry[];
    return script;
  } catch (e) {
    console.error('Failed to parse JSON response from model:', response.text);
    throw new Error('Could not parse the generated script. Please try again.');
  }
};

const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Creates a WAV file blob from raw PCM audio data
function createWavBlob(
  pcmData: Uint8Array,
  sampleRate: number,
  numChannels: number,
  bytesPerSample: number,
): Blob {
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true); // bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  new Uint8Array(buffer, 44).set(pcmData);

  return new Blob([view], {type: 'audio/wav'});
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const generateAudioFromText = async (
  text: string,
  language: 'english' | 'vietnamese',
  voice: 'male' | 'female',
  apiKey?: string,
): Promise<Blob> => {
  const ai = new GoogleGenAI({apiKey: apiKey || process.env.API_KEY});

  const voiceMap = {
    english: {male: 'Puck', female: 'Kore'},
    vietnamese: {male: 'Puck', female: 'Kore'}, // Using same voices, model should adapt to language
  };

  const selectedVoice = voiceMap[language][voice];
  // The TTS model is multilingual and can often infer the language from the text.
  // Prepending instructions can sometimes confuse the model, leading to errors.
  // We will pass the text directly.
  const promptText = text;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{parts: [{text: promptText}]}],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {voiceName: selectedVoice},
        },
      },
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('No audio data received from the API.');
  }

  const pcmData = decodeBase64(base64Audio);
  // Gemini TTS returns 24kHz, 1-channel, 16-bit PCM audio.
  const wavBlob = createWavBlob(pcmData, 24000, 1, 2);

  return wavBlob;
};
