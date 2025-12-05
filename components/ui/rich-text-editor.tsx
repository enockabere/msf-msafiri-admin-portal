'use client';

import { useRef, useEffect } from 'react';
import { Button } from './button';
import { Bold, Italic, Underline, List, Link, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export function RichTextEditor({ value, onChange, placeholder, height = 250 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

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

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand('bold')} className="h-8 w-8 p-0">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand('italic')} className="h-8 w-8 p-0">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand('underline')} className="h-8 w-8 p-0">
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand('justifyLeft')} className="h-8 w-8 p-0">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand('justifyCenter')} className="h-8 w-8 p-0">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand('justifyRight')} className="h-8 w-8 p-0">
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand('insertUnorderedList')} className="h-8 w-8 p-0">
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={insertLink} className="h-8 w-8 p-0">
          <Link className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="p-3 focus:outline-none focus:ring-2 focus:ring-red-500 prose max-w-none"
        style={{ minHeight: height }}
        suppressContentEditableWarning={true}
        placeholder={placeholder}
      />
    </div>
  );
}