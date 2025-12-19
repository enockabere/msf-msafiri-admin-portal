'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from './button';
import {
  Bold, Italic, Underline, List, Link, AlignLeft,
  AlignCenter, AlignRight, Image as ImageIcon, Lock,
  Type, Palette
} from 'lucide-react';
import { toast } from 'sonner';

interface EmailTemplateEditorProps {
  value: string;
  onChange: (content: string) => void;
  registrationUrl: string;
  eventTitle: string;
  placeholder?: string;
  height?: number;
  protectedContent?: string;
}

export function EmailTemplateEditor({
  value,
  onChange,
  registrationUrl,
  eventTitle,
  placeholder,
  height = 300,
  protectedContent
}: EmailTemplateEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);



  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const changeFontSize = () => {
    const size = prompt('Enter font size (1-7):', '3');
    if (size) {
      execCommand('fontSize', size);
    }
  };

  const changeTextColor = () => {
    const color = prompt('Enter color (e.g., #FF0000 or red):');
    if (color) {
      execCommand('foreColor', color);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/upload/email-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const imageUrl = data.url;

      // Insert image into editor
      const img = `<img src="${imageUrl}" alt="Email image" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
      document.execCommand('insertHTML', false, img);

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };



  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent deletion of protected URL section
    if ((e.key === 'Backspace' || e.key === 'Delete') && editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;

        // Check if selection contains or is within protected content
        let node = container instanceof Element ? container : container.parentElement;
        while (node && node !== editorRef.current) {
          if (node.classList?.contains('protected-url')) {
            e.preventDefault();
            toast.warning('This section is protected and cannot be edited or deleted');
            return;
          }
          node = node.parentElement;
        }
      }
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className="h-8 w-8 p-0"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 p-0"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          className="h-8 w-8 p-0"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={changeFontSize}
          className="h-8 w-8 p-0"
          title="Font Size"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={changeTextColor}
          className="h-8 w-8 p-0"
          title="Text Color"
        >
          <Palette className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyLeft')}
          className="h-8 w-8 p-0"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyCenter')}
          className="h-8 w-8 p-0"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyRight')}
          className="h-8 w-8 p-0"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          className="h-8 w-8 p-0"
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 w-8 p-0"
          title="Insert Image"
          disabled={uploading}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {uploading && (
          <span className="text-xs text-gray-500 ml-2">Uploading...</span>
        )}
      </div>

      {/* Editor */}
      <textarea
        ref={editorRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-4 border-0 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
        style={{ 
          minHeight: height, 
          maxHeight: height * 1.5,
          fontFamily: 'inherit'
        }}
        placeholder="Write your email content here..."
      />

      {/* Helper Text */}
      <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 text-xs text-blue-800 flex items-center gap-2">
        <Lock className="h-3 w-3" />
        <span>The registration link will be automatically added at the bottom of your email content when sent.</span>
      </div>
    </div>
  );
}
