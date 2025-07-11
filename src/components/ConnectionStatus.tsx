
import { Circle, Users, Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  state: 'disconnected' | 'connecting' | 'connected' | 'failed';
  connectedPeers: string[];
}

const ConnectionStatus = ({ state, connectedPeers }: ConnectionStatusProps) => {
  const getStatusColor = () => {
    switch (state) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'connected':
        return `Connected (${connectedPeers.length} peer${connectedPeers.length !== 1 ? 's' : ''})`;
      case 'connecting':
        return 'Connecting...';
      case 'failed':
        return 'Connection failed';
      default:
        return 'Not connected';
    }
  };

  const getStatusIcon = () => {
    switch (state) {
      case 'connected':
        return <Wifi className="h-4 w-4" />;
      case 'connecting':
        return <Circle className="h-4 w-4 animate-pulse" />;
      case 'failed':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
      <div className="flex items-center gap-2">
        <div className={getStatusColor()}>
          {getStatusIcon()}
        </div>
        <span className="font-medium">{getStatusText()}</span>
      </div>
      
      {connectedPeers.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {connectedPeers.length}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
