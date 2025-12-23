'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from './button';
import {
  Bold, Italic, Underline, List, Link, AlignLeft,
  AlignCenter, AlignRight, Image as ImageIcon, Lock,
  Type, Palette, Code
} from 'lucide-react';
import { toast } from 'sonner';

interface EmailTemplateEditorProps {
  value: string;
  onChange: (content: string) => void;
  registrationUrl: string;
  eventTitle: string;
  eventData?: any;
  tenantData?: any;
  placeholder?: string;
  height?: number;
  protectedContent?: string;
}

// Email template variables that can be used
const EMAIL_TEMPLATE_VARIABLES = [
  { variable: '{{eventTitle}}', description: 'Event title/name' },
  { variable: '{{eventStartDate}}', description: 'Event start date' },
  { variable: '{{eventEndDate}}', description: 'Event end date' },
  { variable: '{{eventLocation}}', description: 'Event location' },
  { variable: '{{registrationDeadline}}', description: 'Registration deadline' },
  { variable: '{{tenantName}}', description: 'Organization name' },
  { variable: '{{tenantTimezone}}', description: 'Organization timezone' },
  { variable: '{{currentDate}}', description: 'Current date' },
  { variable: '{{registrationUrl}}', description: 'Registration form link' },
];

export function EmailTemplateEditor({
  value,
  onChange,
  registrationUrl,
  eventTitle,
  eventData,
  tenantData,
  placeholder,
  height = 300,
  protectedContent
}: EmailTemplateEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showVariables, setShowVariables] = useState(false);



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



  const insertVariable = (variable: string) => {
    if (editorRef.current) {
      const textarea = editorRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + variable + ' ' + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 1, start + variable.length + 1);
      }, 0);
      
      setShowVariables(false);
      toast.success(`Inserted ${variable}`);
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

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowVariables(!showVariables)}
            className="h-8 px-2"
            title="Insert Variable"
          >
            <Code className="h-4 w-4 mr-1" />
            <span className="text-xs">Variables</span>
          </Button>

          {showVariables && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2 border-b bg-gray-50">
                <p className="text-xs font-semibold text-gray-700">Click to insert variable:</p>
              </div>
              <div className="p-2 space-y-1">
                {EMAIL_TEMPLATE_VARIABLES.map(({ variable, description }) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex flex-col"
                  >
                    <span className="text-sm font-mono text-blue-600">{variable}</span>
                    <span className="text-xs text-gray-500">{description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
      <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 text-xs text-blue-800">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-3 w-3" />
          <span>The registration link will be automatically added at the bottom of your email content when sent.</span>
        </div>
        <div className="flex items-center gap-2">
          <Code className="h-3 w-3" />
          <span>Use variables like <code className="bg-blue-100 px-1 rounded">{'{{eventTitle}}'}</code> to personalize the email. They will be replaced with actual data when sent.</span>
        </div>
      </div>
    </div>
  );
}
