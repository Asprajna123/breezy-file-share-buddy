
import { useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';

export const useWebRTC = () => {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [connectedPeers, setConnectedPeers] = useState([]);
  const [incomingFiles, setIncomingFiles] = useState([]);
  const [outgoingFiles, setOutgoingFiles] = useState([]);
  const [connectionError, setConnectionError] = useState(null);

  const socketRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const currentRoomRef = useRef(null);
  const pendingTransfersRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);

  // Enhanced ICE servers configuration
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' }
  ];

  const CONNECTION_TIMEOUT = 10000; // 10 seconds
  const RECONNECT_DELAY = 3000; // 3 seconds

  // Get the signaling server URL based on environment
  const getSignalingServerUrl = useCallback(() => {
    // Try to detect if we're in development (localhost) or need to use IP
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    // For mobile devices, you'll need to replace this with your laptop's actual IP
    // Find your laptop's IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
    return 'http://192.168.1.100:3001'; // Replace with your laptop's IP address
  }, []);

  // Check if signaling server is accessible
  const checkServerHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const serverUrl = getSignalingServerUrl();
      const response = await fetch(`${serverUrl}/health`, { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Signaling server health check failed:', error);
      return false;
    }
  }, [getSignalingServerUrl]);

  const createPeerConnection = useCallback((socketId) => {
    console.log(`Creating peer connection with ${socketId}`);
    
    const peerConnection = new RTCPeerConnection({ 
      iceServers,
      iceCandidatePoolSize: 10
    });

    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection state with ${socketId}:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'connected') {
        console.log(`Successfully connected to peer ${socketId}`);
        setConnectedPeers(prev => {
          if (!prev.includes(socketId)) {
            return [...prev, socketId];
          }
          return prev;
        });
        
        const peer = peerConnectionsRef.current.get(socketId);
        if (peer?.connectionTimeout) {
          clearTimeout(peer.connectionTimeout);
        }
      } else if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        console.log(`Connection failed/disconnected with peer ${socketId}`);
        setConnectedPeers(prev => prev.filter(id => id !== socketId));
        
        const peer = peerConnectionsRef.current.get(socketId);
        if (peer?.connectionTimeout) {
          clearTimeout(peer.connectionTimeout);
        }
        peerConnectionsRef.current.delete(socketId);
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log(`Sending ICE candidate to ${socketId}`);
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          targetSocketId: socketId
        });
      }
    };

    peerConnection.ondatachannel = (event) => {
      console.log(`Received data channel from ${socketId}`);
      const channel = event.channel;
      setupDataChannel(channel, socketId);
    };

    return peerConnection;
  }, []);

  const setupDataChannel = useCallback((channel, peerId) => {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      console.log(`Data channel opened with peer ${peerId}`);
    };

    channel.onmessage = (event) => {
      try {
        if (typeof event.data === 'string') {
          const metadata = JSON.parse(event.data);
          if (metadata.type === 'file-start') {
            console.log(`Starting file transfer: ${metadata.name} from ${peerId}`);
            pendingTransfersRef.current.set(metadata.transferId, {
              chunks: [],
              received: 0,
              total: metadata.size
            });

            const transfer = {
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
              console.log(`File transfer complete: ${transferId}`);
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
  }, []);

  const connectToSignalingServer = useCallback(async () => {
    console.log('Checking signaling server health...');
    
    // First check if server is accessible
    const isServerHealthy = await checkServerHealth();
    if (!isServerHealthy) {
      console.error('Signaling server is not accessible at localhost:3001');
      const serverUrl = getSignalingServerUrl();
      setConnectionError(`Signaling server not accessible. Please ensure the server is running on ${serverUrl.replace('http://', '')}`);
      setConnectionState('failed');
      return null;
    }

    console.log('Connecting to signaling server...');
    setConnectionError(null);
    
    const serverUrl = getSignalingServerUrl();
    console.log('Using signaling server URL:', serverUrl);
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionAttempts: 3
    });

    socket.on('connect', () => {
      console.log('Connected to signaling server with ID:', socket.id);
      socketRef.current = socket;
      setConnectionError(null);
      
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Signaling server connection error:', error);
      setConnectionError(`Connection failed: ${error.message}`);
      setConnectionState('failed');
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from signaling server:', reason);
      setConnectionState('disconnected');
      setConnectedPeers([]);
      
      // Clean up all peer connections
      peerConnectionsRef.current.forEach(peer => {
        if (peer.connectionTimeout) {
          clearTimeout(peer.connectionTimeout);
        }
        peer.connection.close();
      });
      peerConnectionsRef.current.clear();
    });

    socket.on('all-users', async (users) => {
      console.log('All users in room:', users);
      setConnectionState('connected');
      
      for (const userId of users) {
        if (!peerConnectionsRef.current.has(userId)) {
          console.log(`Creating connection to existing user: ${userId}`);
          
          const peerConnection = createPeerConnection(userId);
          const dataChannel = peerConnection.createDataChannel('fileTransfer', {
            ordered: true
          });
          setupDataChannel(dataChannel, userId);
          
          const connectionTimeout = setTimeout(() => {
            console.log(`Connection timeout with ${userId}`);
            peerConnection.close();
            peerConnectionsRef.current.delete(userId);
          }, CONNECTION_TIMEOUT);
          
          peerConnectionsRef.current.set(userId, {
            connection: peerConnection,
            dataChannel,
            socketId: userId,
            connectionTimeout
          });

          try {
            const offer = await peerConnection.createOffer({
              offerToReceiveAudio: false,
              offerToReceiveVideo: false
            });
            await peerConnection.setLocalDescription(offer);
            
            console.log(`Sending offer to ${userId}`);
            socket.emit('offer', { offer, targetSocketId: userId });
          } catch (error) {
            console.error(`Error creating offer for ${userId}:`, error);
          }
        }
      }
    });

    socket.on('user-joined', (socketId) => {
      console.log('User joined:', socketId);
    });

    socket.on('offer', async ({ offer, senderSocketId }) => {
      console.log('Received offer from:', senderSocketId);
      
      try {
        const peerConnection = createPeerConnection(senderSocketId);
        
        const connectionTimeout = setTimeout(() => {
          console.log(`Connection timeout with ${senderSocketId}`);
          peerConnection.close();
          peerConnectionsRef.current.delete(senderSocketId);
        }, CONNECTION_TIMEOUT);
        
        peerConnectionsRef.current.set(senderSocketId, {
          connection: peerConnection,
          socketId: senderSocketId,
          connectionTimeout
        });

        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        console.log(`Sending answer to ${senderSocketId}`);
        socket.emit('answer', { answer, targetSocketId: senderSocketId });
      } catch (error) {
        console.error(`Error handling offer from ${senderSocketId}:`, error);
      }
    });

    socket.on('answer', async ({ answer, senderSocketId }) => {
      console.log('Received answer from:', senderSocketId);
      
      const peer = peerConnectionsRef.current.get(senderSocketId);
      if (peer) {
        try {
          await peer.connection.setRemoteDescription(answer);
          console.log(`Successfully set remote description for ${senderSocketId}`);
        } catch (error) {
          console.error(`Error setting remote description for ${senderSocketId}:`, error);
        }
      }
    });

    socket.on('ice-candidate', async ({ candidate, senderSocketId }) => {
      console.log(`Received ICE candidate from ${senderSocketId}`);
      
      const peer = peerConnectionsRef.current.get(senderSocketId);
      if (peer) {
        try {
          await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
          console.log(`Successfully added ICE candidate for ${senderSocketId}`);
        } catch (error) {
          console.error(`Error adding ICE candidate for ${senderSocketId}:`, error);
        }
      }
    });

    socket.on('user-disconnected', (socketId) => {
      console.log('User disconnected:', socketId);
      const peer = peerConnectionsRef.current.get(socketId);
      if (peer) {
        if (peer.connectionTimeout) {
          clearTimeout(peer.connectionTimeout);
        }
        peer.connection.close();
        peerConnectionsRef.current.delete(socketId);
      }
      setConnectedPeers(prev => prev.filter(id => id !== socketId));
    });

    return socket;
  }, [createPeerConnection, setupDataChannel, checkServerHealth]);

  const createRoom = useCallback(async (roomCode) => {
    setConnectionState('connecting');
    
    try {
      const socket = await connectToSignalingServer();
      if (!socket) {
        throw new Error('Failed to connect to signaling server');
      }
      
      currentRoomRef.current = roomCode;
      socket.emit('join-room', roomCode);
      console.log(`Room ${roomCode} created successfully`);
    } catch (error) {
      console.error('Error creating room:', error);
      setConnectionState('failed');
      throw error;
    }
  }, [connectToSignalingServer]);

  const joinRoom = useCallback(async (roomCode) => {
    setConnectionState('connecting');
    
    try {
      const socket = await connectToSignalingServer();
      if (!socket) {
        throw new Error('Failed to connect to signaling server');
      }
      
      currentRoomRef.current = roomCode;
      socket.emit('join-room', roomCode);
      console.log(`Joined room ${roomCode} successfully`);
    } catch (error) {
      console.error('Error joining room:', error);
      setConnectionState('failed');
      throw error;
    }
  }, [connectToSignalingServer]);

  const sendFile = useCallback((file) => {
    const transferId = `${Date.now()}-${Math.random()}`;
    
    const transfer = {
      id: transferId,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'pending'
    };

    setOutgoingFiles(prev => [...prev, transfer]);

    peerConnectionsRef.current.forEach((peer, peerId) => {
      if (peer.dataChannel && peer.dataChannel.readyState === 'open') {
        console.log(`Sending file ${file.name} to peer ${peerId}`);
        
        const metadata = {
          type: 'file-start',
          transferId,
          name: file.name,
          size: file.size,
          fileType: file.type
        };
        peer.dataChannel.send(JSON.stringify(metadata));

        const chunkSize = 16384;
        const reader = new FileReader();
        let offset = 0;

        const sendChunk = () => {
          const chunk = file.slice(offset, offset + chunkSize);
          reader.onload = (e) => {
            if (e.target?.result && peer.dataChannel?.readyState === 'open') {
              const arrayBuffer = e.target.result;
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
                setTimeout(sendChunk, 10);
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

  const downloadFile = useCallback((transfer) => {
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

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketRef.current?.disconnect();
      peerConnectionsRef.current.forEach(peer => {
        if (peer.connectionTimeout) {
          clearTimeout(peer.connectionTimeout);
        }
        peer.connection.close();
      });
      peerConnectionsRef.current.clear();
    };
  }, []);

  return {
    connectionState,
    connectedPeers,
    incomingFiles,
    outgoingFiles,
    connectionError,
    createRoom,
    joinRoom,
    sendFile,
    downloadFile
  };
};
