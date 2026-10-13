import React, { useState } from 'react';
import { extractTextFromFile, SupportedFormat } from '../lib/document-parser';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Loader2, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';

export function DocumentExtractorDemo() {
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileInfo({ 
      name: file.name, 
      size: (file.size / 1024).toFixed(2) + ' KB' 
    });
    
    try {
      const text = await extractTextFromFile(file);
      setExtractedText(text);
      toast.success('Document extracted successfully');
    } catch (error) {
      console.error('Extraction failed:', error);
      toast.error('Failed to extract document: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Local Document Extractor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 space-y-4">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground">PDF, DOCX, DOC, XLSX, XLS, PPTX</p>
          </div>
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx"
            disabled={loading}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Extracting content...</span>
          </div>
        )}

        {fileInfo && !loading && (
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm font-semibold">{fileInfo.name}</p>
            <p className="text-xs text-muted-foreground">{fileInfo.size}</p>
          </div>
        )}

        {extractedText && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Extracted Text (first 500 chars):</h3>
            <div className="bg-background border rounded-md p-4 max-h-[300px] overflow-y-auto font-mono text-xs whitespace-pre-wrap">
              {extractedText.length > 500 ? extractedText.substring(0, 500) + '...' : extractedText}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => navigator.clipboard.writeText(extractedText)}
            >
              Copy Full Text
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
