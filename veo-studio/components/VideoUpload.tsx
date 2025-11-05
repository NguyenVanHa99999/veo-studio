/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {UploadCloudIcon, XMarkIcon} from './icons';

interface VideoUploadProps {
  videoUrl: string | null;
  onVideoUpload: (files: FileList | null) => void;
  onRemoveVideo: () => void;
}

/**
 * Component để upload video
 * Reusable và tách biệt logic upload
 */
const VideoUpload: React.FC<VideoUploadProps> = ({
  videoUrl,
  onVideoUpload,
  onRemoveVideo,
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-gray-300">
        1. Upload Your Video
      </h2>
      {videoUrl ? (
        <div className="flex flex-col items-center">
          <video src={videoUrl} controls className="w-full max-w-md rounded-lg" />
          <button
            onClick={onRemoveVideo}
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
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">MP4, MOV, AVI, etc.</p>
            </div>
            <input
              id="dropzone-file"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => onVideoUpload(e.target.files)}
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
