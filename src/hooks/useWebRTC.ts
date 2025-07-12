
import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface FileTransfer {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  peer?: string;
  blob?: Blob;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed';

interface PeerConnection {
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  socketId: string;
}

export const useWebRTC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [incomingFiles, setIncomingFiles] = useState<FileTransfer[]>([]);
  const [outgoingFiles, setOutgoingFiles] = useState<FileTransfer[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const currentRoomRef = useRef<string | null>(null);
  const pendingTransfersRef = useRef<Map<string, { chunks: ArrayBuffer[]; received: number; total: number }>>(new Map());

  // ICE servers configuration
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // Create peer connection for a specific peer
  const createPeerConnection = useCallback((socketId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({ iceServers });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          targetSocketId: socketId
        });
      }
    };

    // Handle incoming data channel
    peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      setupDataChannel(channel, socketId);
    };

    return peerConnection;
  }, []);

  // Setup data channel for file transfer
  const setupDataChannel = useCallback((channel: RTCDataChannel, peerId: string) => {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      console.log(`Data channel opened with peer ${peerId}`);
    };

    channel.onmessage = (event) => {
      try {
        if (typeof event.data === 'string') {
          // Handle metadata
          const metadata = JSON.parse(event.data);
          if (metadata.type === 'file-start') {
            pendingTransfersRef.current.set(metadata.transferId, {
              chunks: [],
              received: 0,
              total: metadata.size
            });

            const transfer: FileTransfer = {
              id: metadata.transferId,
              name: metadata.name,
              size: metadata.size,
              type: metadata.fileType,
              progress: 0,
              status: 'transferring',
              peer: peerId
            };

            setIncomingFiles(prev => [...prev, transfer]);
          }
        } else {
          // Handle file chunk
          const transferId = new TextDecoder().decode(event.data.slice(0, 36));
          const chunkData = event.data.slice(36);
          
          const pending = pendingTransfersRef.current.get(transferId);
          if (pending) {
            pending.chunks.push(chunkData);
            pending.received += chunkData.byteLength;
            
            const progress = (pending.received / pending.total) * 100;
            
            setIncomingFiles(prev => 
              prev.map(t => 
                t.id === transferId 
                  ? { ...t, progress: Math.round(progress) }
                  : t
              )
            );

            if (pending.received >= pending.total) {
              // File transfer complete
              const completeFile = new Blob(pending.chunks);
              
              setIncomingFiles(prev => 
                prev.map(t => 
                  t.id === transferId 
                    ? { ...t, progress: 100, status: 'completed', blob: completeFile }
                    : t
                )
              );

              pendingTransfersRef.current.delete(transferId);
            }
          }
        }
      } catch (error) {
        console.error('Error handling data channel message:', error);
      }
    };

    channel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  }, []);

  // Connect to signaling server
  const connectToSignalingServer = useCallback(() => {
    // For demo purposes, we'll use a public signaling server or localhost
    // In production, you'd use your own signaling server
    const socket = io('ws://localhost:3001', {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Connected to signaling server');
      socketRef.current = socket;
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
      setConnectionState('disconnected');
      setConnectedPeers([]);
    });

    // Handle all users in room
    socket.on('all-users', (users: string[]) => {
      console.log('All users in room:', users);
      setConnectedPeers(users);
      setConnectionState('connected');
      
      // Create peer connections for existing users
      users.forEach(userId => {
        if (!peerConnectionsRef.current.has(userId)) {
          const peerConnection = createPeerConnection(userId);
          const dataChannel = peerConnection.createDataChannel('fileTransfer');
          setupDataChannel(dataChannel, userId);
          
          peerConnectionsRef.current.set(userId, {
            connection: peerConnection,
            dataChannel,
            socketId: userId
          });

          // Create offer
          peerConnection.createOffer().then(offer => {
            peerConnection.setLocalDescription(offer);
            socket.emit('offer', { offer, targetSocketId: userId });
          });
        }
      });
    });

    // Handle new user joined
    socket.on('user-joined', (socketId: string) => {
      console.log('User joined:', socketId);
      setConnectedPeers(prev => [...prev, socketId]);
    });

    // Handle offer
    socket.on('offer', async ({ offer, senderSocketId }: { offer: RTCSessionDescriptionInit; senderSocketId: string }) => {
      console.log('Received offer from:', senderSocketId);
      
      const peerConnection = createPeerConnection(senderSocketId);
      peerConnectionsRef.current.set(senderSocketId, {
        connection: peerConnection,
        socketId: senderSocketId
      });

      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit('answer', { answer, targetSocketId: senderSocketId });
    });

    // Handle answer
    socket.on('answer', async ({ answer, senderSocketId }: { answer: RTCSessionDescriptionInit; senderSocketId: string }) => {
      console.log('Received answer from:', senderSocketId);
      
      const peer = peerConnectionsRef.current.get(senderSocketId);
      if (peer) {
        await peer.connection.setRemoteDescription(answer);
      }
    });

    // Handle ICE candidate
    socket.on('ice-candidate', async ({ candidate, senderSocketId }: { candidate: RTCIceCandidateInit; senderSocketId: string }) => {
      const peer = peerConnectionsRef.current.get(senderSocketId);
      if (peer) {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Handle user disconnected
    socket.on('user-disconnected', (socketId: string) => {
      console.log('User disconnected:', socketId);
      const peer = peerConnectionsRef.current.get(socketId);
      if (peer) {
        peer.connection.close();
        peerConnectionsRef.current.delete(socketId);
      }
      setConnectedPeers(prev => prev.filter(id => id !== socketId));
    });

    return socket;
  }, [createPeerConnection, setupDataChannel]);

  // Create room
  const createRoom = useCallback(async (roomCode: string) => {
    setConnectionState('connecting');
    
    try {
      const socket = connectToSignalingServer();
      currentRoomRef.current = roomCode;
      
      socket.emit('join-room', roomCode);
      console.log(`Room ${roomCode} created successfully`);
    } catch (error) {
      setConnectionState('failed');
      throw error;
    }
  }, [connectToSignalingServer]);

  // Join room
  const joinRoom = useCallback(async (roomCode: string) => {
    setConnectionState('connecting');
    
    try {
      const socket = connectToSignalingServer();
      currentRoomRef.current = roomCode;
      
      socket.emit('join-room', roomCode);
      console.log(`Joined room ${roomCode} successfully`);
    } catch (error) {
      setConnectionState('failed');
      throw error;
    }
  }, [connectToSignalingServer]);

  // Send file to all connected peers
  const sendFile = useCallback((file: File) => {
    const transferId = `${Date.now()}-${Math.random()}`;
    
    const transfer: FileTransfer = {
      id: transferId,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'pending'
    };

    setOutgoingFiles(prev => [...prev, transfer]);

    // Send to all connected peers
    peerConnectionsRef.current.forEach((peer, peerId) => {
      if (peer.dataChannel && peer.dataChannel.readyState === 'open') {
        // Send file metadata first
        const metadata = {
          type: 'file-start',
          transferId,
          name: file.name,
          size: file.size,
          fileType: file.type
        };
        peer.dataChannel.send(JSON.stringify(metadata));

        // Send file in chunks
        const chunkSize = 16384; // 16KB chunks
        const reader = new FileReader();
        let offset = 0;

        const sendChunk = () => {
          const chunk = file.slice(offset, offset + chunkSize);
          reader.onload = (e) => {
            if (e.target?.result && peer.dataChannel?.readyState === 'open') {
              const arrayBuffer = e.target.result as ArrayBuffer;
              const transferIdBuffer = new TextEncoder().encode(transferId.padEnd(36));
              const combinedBuffer = new ArrayBuffer(transferIdBuffer.byteLength + arrayBuffer.byteLength);
              const combinedView = new Uint8Array(combinedBuffer);
              combinedView.set(new Uint8Array(transferIdBuffer), 0);
              combinedView.set(new Uint8Array(arrayBuffer), transferIdBuffer.byteLength);
              
              peer.dataChannel.send(combinedBuffer);
              
              offset += chunkSize;
              const progress = Math.min((offset / file.size) * 100, 100);
              
              setOutgoingFiles(prev => 
                prev.map(t => 
                  t.id === transferId 
                    ? { ...t, progress: Math.round(progress), status: 'transferring' }
                    : t
                )
              );

              if (offset < file.size) {
                setTimeout(sendChunk, 10); // Small delay between chunks
              } else {
                setOutgoingFiles(prev => 
                  prev.map(t => 
                    t.id === transferId 
                      ? { ...t, progress: 100, status: 'completed' }
                      : t
                  )
                );
              }
            }
          };
          reader.readAsArrayBuffer(chunk);
        };

        sendChunk();
      }
    });
  }, []);

  // Download file
  const downloadFile = useCallback((transfer: FileTransfer) => {
    if (!transfer.blob) return;

    const url = URL.createObjectURL(transfer.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = transfer.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      peerConnectionsRef.current.forEach(peer => peer.connection.close());
      peerConnectionsRef.current.clear();
    };
  }, []);

  return {
    connectionState,
    connectedPeers,
    incomingFiles,
    outgoingFiles,
    createRoom,
    joinRoom,
    sendFile,
    downloadFile
  };
};
