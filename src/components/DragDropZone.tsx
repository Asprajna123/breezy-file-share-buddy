
import { useState, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DragDropZoneProps {
  onFileDrop: (files: File[]) => void;
  disabled?: boolean;
}

const DragDropZone = ({ onFileDrop, disabled = false }: DragDropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileDrop(files);
    }
  }, [onFileDrop, disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileDrop(files);
    }
  }, [onFileDrop, disabled]);

  return (
    <Card className={`transition-all duration-200 ${
      isDragOver && !disabled 
        ? 'border-primary bg-primary/5 scale-105' 
        : disabled 
        ? 'border-muted bg-muted/20 opacity-50'
        : 'border-dashed border-2 hover:border-primary/50'
    }`}>
      <CardContent 
        className="flex flex-col items-center justify-center p-12 text-center"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`rounded-full p-4 mb-4 ${
          isDragOver && !disabled 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}>
          <Upload className="h-8 w-8" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">
          {disabled ? 'Connect to a room first' : 'Drop files here to share'}
        </h3>
        
        <p className="text-muted-foreground mb-4">
          {disabled 
            ? 'You need to be connected to share files'
            : 'Drag and drop files here, or click to select'
          }
        </p>

        {!disabled && (
          <div>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Select Files
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DragDropZone;
