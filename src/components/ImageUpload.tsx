'use client';

import { Upload } from 'lucide-react';
import { useRef } from 'react';

interface ImageUploadProps {
  onImageUpload: (imageData: string) => void;
  isProcessing: boolean;
}

export default function ImageUpload({
  onImageUpload,
  isProcessing,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    // Convert to data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      onImageUpload(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />

      <button
        onClick={handleClick}
        disabled={isProcessing}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload size={20} />
        {isProcessing ? 'Processing...' : 'Upload Screenshot'}
      </button>
    </div>
  );
}
