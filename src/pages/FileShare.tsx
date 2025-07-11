
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Users, Copy, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DragDropZone from '@/components/DragDropZone';
import ConnectionStatus from '@/components/ConnectionStatus';
import FileTransferList from '@/components/FileTransferList';
import { useWebRTC } from '@/hooks/useWebRTC';

const FileShare = () => {
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const { toast } = useToast();
  
  const {
    connectionState,
    connectedPeers,
    createRoom,
    joinRoom,
    sendFile,
    incomingFiles,
    outgoingFiles
  } = useWebRTC();

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    return code;
  };

  const handleCreateRoom = async () => {
    const code = generateRoomCode();
    try {
      await createRoom(code);
      setIsHost(true);
      toast({
        title: "Room Created",
        description: `Room code: ${code}. Share this code with others to connect.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room code.",
        variant: "destructive",
      });
      return;
    }

    try {
      await joinRoom(roomCode.toUpperCase());
      toast({
        title: "Joined Room",
        description: `Connected to room ${roomCode.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join room. Please check the room code.",
        variant: "destructive",
      });
    }
  };

  const handleFileDrop = useCallback((files: File[]) => {
    if (connectedPeers.length === 0) {
      toast({
        title: "No Connection",
        description: "Please connect to a room first to share files.",
        variant: "destructive",
      });
      return;
    }

    files.forEach(file => {
      sendFile(file);
    });

    toast({
      title: "Files Queued",
      description: `${files.length} file(s) are being sent.`,
    });
  }, [connectedPeers, sendFile, toast]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: "Copied!",
      description: "Room code copied to clipboard.",
    });
  };

  const shareableUrl = `${window.location.origin}/join/${roomCode}`;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            P2P File Sharing
          </h1>
          <p className="text-xl text-muted-foreground">
            Share files directly between devices using WebRTC
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Connection Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ConnectionStatus 
                state={connectionState} 
                connectedPeers={connectedPeers} 
              />

              {!isHost && connectionState === 'disconnected' && (
                <>
                  <div className="space-y-2">
                    <Button 
                      onClick={handleCreateRoom} 
                      className="w-full"
                      size="lg"
                    >
                      Create New Room
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or join existing room
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter room code"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                    <Button onClick={handleJoinRoom}>
                      Join
                    </Button>
                  </div>
                </>
              )}

              {isHost && roomCode && (
                <div className="space-y-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Share this room code:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-background rounded text-lg font-mono">
                        {roomCode}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyRoomCode}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Or share this URL:
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={shareableUrl}
                        readOnly
                        className="text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(shareableUrl);
                          toast({
                            title: "Copied!",
                            description: "URL copied to clipboard.",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Sharing Panel */}
          <div className="space-y-6">
            <DragDropZone
              onFileDrop={handleFileDrop}
              disabled={connectedPeers.length === 0}
            />

            <FileTransferList
              incomingFiles={incomingFiles}
              outgoingFiles={outgoingFiles}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileShare;
