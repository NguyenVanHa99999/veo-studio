/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {
  Download,
  FileText,
  KeyRound,
  LoaderCircle,
  UploadCloud,
  Volume2,
  X,
  // FIX: Add missing icon imports from lucide-react
  ArrowRight,
  Baseline,
  BookImage,
  ChevronDown,
  Film,
  GalleryThumbnails,
  Layers,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Tv,
} from 'lucide-react';

const defaultProps = {
  strokeWidth: 1.5,
};

export const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <KeyRound {...defaultProps} {...props} />
);

export const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <X {...defaultProps} {...props} />
);

export const UploadCloudIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <UploadCloud {...defaultProps} {...props} />;

export const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <FileText {...defaultProps} {...props} />;

export const Volume2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Volume2 {...defaultProps} {...props} />
);

export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Download {...defaultProps} {...props} />;

export const LoaderCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <LoaderCircle {...defaultProps} {...props} />;

// FIX: Add missing icon component exports
export const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ArrowRight {...defaultProps} {...props} />;

export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ChevronDown {...defaultProps} {...props} />;

export const FilmIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Film {...defaultProps} {...props} />
);

export const FramesModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <GalleryThumbnails {...defaultProps} {...props} />;

export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Plus {...defaultProps} {...props} />
);

export const RectangleStackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Layers {...defaultProps} {...props} />;

export const ReferencesModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <BookImage {...defaultProps} {...props} />;

export const SlidersHorizontalIcon: React.FC<
  React.SVGProps<SVGSVGElement>
> = (props) => <SlidersHorizontal {...defaultProps} {...props} />;

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Sparkles {...defaultProps} {...props} />;

export const TextModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Baseline {...defaultProps} {...props} />;

export const TvIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Tv {...defaultProps} {...props} />
);

export const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <RefreshCw {...defaultProps} {...props} />;
