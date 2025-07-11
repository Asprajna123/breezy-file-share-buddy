
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Image, 
  Music, 
  Video, 
  File, 
  Download, 
  Upload,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface FileTransfer {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  peer?: string;
}

interface FileTransferListProps {
  incomingFiles: FileTransfer[];
  outgoingFiles: FileTransfer[];
}

const FileTransferList = ({ incomingFiles, outgoingFiles }: FileTransferListProps) => {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (type.includes('text') || type.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const FileTransferItem = ({ transfer, isIncoming }: { transfer: FileTransfer; isIncoming: boolean }) => (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <div className="flex items-center gap-2 flex-1">
        {isIncoming ? (
          <Download className="h-4 w-4 text-blue-500" />
        ) : (
          <Upload className="h-4 w-4 text-green-500" />
        )}
        {getFileIcon(transfer.type)}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{transfer.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatFileSize(transfer.size)}
            {transfer.peer && ` • ${isIncoming ? 'from' : 'to'} ${transfer.peer}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {getStatusIcon(transfer.status)}
        {transfer.status === 'transferring' && (
          <div className="w-20">
            <Progress value={transfer.progress} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );

  const hasTransfers = incomingFiles.length > 0 || outgoingFiles.length > 0;

  if (!hasTransfers) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Transfers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {outgoingFiles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Sending ({outgoingFiles.length})
            </h4>
            <div className="space-y-2">
              {outgoingFiles.map(transfer => (
                <FileTransferItem 
                  key={transfer.id} 
                  transfer={transfer} 
                  isIncoming={false}
                />
              ))}
            </div>
          </div>
        )}

        {incomingFiles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Receiving ({incomingFiles.length})
            </h4>
            <div className="space-y-2">
              {incomingFiles.map(transfer => (
                <FileTransferItem 
                  key={transfer.id} 
                  transfer={transfer} 
                  isIncoming={true}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileTransferList;
