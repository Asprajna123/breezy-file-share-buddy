
import { useState, useRef, useCallback, useEffect } from 'react';

interface FileTransfer {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  peer?: string;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed';

export const useWebRTC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [incomingFiles, setIncomingFiles] = useState<FileTransfer[]>([]);
  const [outgoingFiles, setOutgoingFiles] = useState<FileTransfer[]>([]);

  const websocketRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());
  const currentRoomRef = useRef<string | null>(null);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      // For demo purposes, we'll simulate a WebSocket connection
      // In a real app, you'd connect to your signaling server
      console.log('Connecting to signaling server...');
      
      // Simulate WebSocket connection
      setTimeout(() => {
        const mockWs = {
          readyState: WebSocket.OPEN,
          send: (data: string) => {
            console.log('Mock WebSocket send:', data);
            // Simulate echo for demo
            setTimeout(() => {
              const message = JSON.parse(data);
              if (message.type === 'join-room' || message.type === 'create-room') {
                handleMockSignaling(message);
              }
            }, 100);
          },
          close: () => console.log('Mock WebSocket closed'),
        };
        
        websocketRef.current = mockWs as any;
        resolve();
      }, 500);
    });
  }, []);

  // Mock signaling for demo purposes
  const handleMockSignaling = useCallback((message: any) => {
    if (message.type === 'create-room' || message.type === 'join-room') {
      setConnectionState('connected');
      // Simulate peer connection for demo
      setConnectedPeers(['demo-peer']);
    }
  }, []);

  const createRoom = useCallback(async (roomCode: string) => {
    setConnectionState('connecting');
    
    try {
      await connectWebSocket();
      currentRoomRef.current = roomCode;
      
      // Send create room message
      websocketRef.current?.send(JSON.stringify({
        type: 'create-room',
        roomCode
      }));

      console.log(`Room ${roomCode} created successfully`);
    } catch (error) {
      setConnectionState('failed');
      throw error;
    }
  }, [connectWebSocket]);

  const joinRoom = useCallback(async (roomCode: string) => {
    setConnectionState('connecting');
    
    try {
      await connectWebSocket();
      currentRoomRef.current = roomCode;
      
      // Send join room message
      websocketRef.current?.send(JSON.stringify({
        type: 'join-room',
        roomCode
      }));

      console.log(`Joined room ${roomCode} successfully`);
    } catch (error) {
      setConnectionState('failed');
      throw error;
    }
  }, [connectWebSocket]);

  const sendFile = useCallback((file: File) => {
    const transfer: FileTransfer = {
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'pending',
      peer: connectedPeers[0] || 'demo-peer'
    };

    setOutgoingFiles(prev => [...prev, transfer]);

    // Simulate file transfer progress for demo
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setOutgoingFiles(prev => 
          prev.map(t => 
            t.id === transfer.id 
              ? { ...t, progress: 100, status: 'completed' }
              : t
          )
        );

        // Simulate receiving the file on the other end
        setTimeout(() => {
          const receivedTransfer: FileTransfer = {
            id: `received-${transfer.id}`,
            name: transfer.name,
            size: transfer.size,
            type: transfer.type,
            progress: 100,
            status: 'completed',
            peer: 'demo-peer'
          };
          setIncomingFiles(prev => [...prev, receivedTransfer]);
        }, 500);
      }

      setOutgoingFiles(prev => 
        prev.map(t => 
          t.id === transfer.id 
            ? { ...t, progress, status: 'transferring' }
            : t
        )
      );
    }, 200);

  }, [connectedPeers]);

  // Cleanup
  useEffect(() => {
    return () => {
      websocketRef.current?.close();
      peerConnectionsRef.current.forEach(pc => pc.close());
    };
  }, []);

  return {
    connectionState,
    connectedPeers,
    incomingFiles,
    outgoingFiles,
    createRoom,
    joinRoom,
    sendFile
  };
};
