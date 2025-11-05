/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// FIX: Add import for Video type from @google/genai
import {Video} from '@google/genai';

export interface ScriptEntry {
  timestamp: string;
  text: string;
}

// FIX: Add AspectRatio enum for video generation options.
export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

// FIX: Add Resolution enum for video generation options.
export enum Resolution {
  P720 = '720p',
  P1080 = '1080p',
}

// FIX: Add VeoModel enum for video generation model selection.
export enum VeoModel {
  VEO = 'veo-3.1-generate-preview',
  VEO_FAST = 'veo-3.1-fast-generate-preview',
}

// FIX: Add GenerationMode enum for different video generation modes.
export enum GenerationMode {
  TEXT_TO_VIDEO = 'Text-to-Video',
  FRAMES_TO_VIDEO = 'Frames-to-Video',
  REFERENCES_TO_VIDEO = 'References-to-Video',
  EXTEND_VIDEO = 'Extend-Video',
}

// FIX: Add ImageFile interface for handling uploaded images.
export interface ImageFile {
  file: File;
  base64: string;
}

// FIX: Add VideoFile interface for handling uploaded videos.
export interface VideoFile {
  file: File;
  base64: string;
}

// FIX: Add GenerateVideoParams interface for video generation parameters.
export interface GenerateVideoParams {
  prompt: string;
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  mode: GenerationMode;
  startFrame: ImageFile | null;
  endFrame: ImageFile | null;
  referenceImages: ImageFile[];
  styleImage: ImageFile | null;
  inputVideo: VideoFile | null;
  inputVideoObject: Video | null;
  isLooping: boolean;
}
