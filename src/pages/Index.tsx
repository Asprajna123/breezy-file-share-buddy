import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Upload, 
  Shield, 
  Zap, 
  Users, 
  FileText, 
  Image, 
  Music, 
  Video,
  Download,
  Link2,
  CheckCircle,
  ArrowRight,
  Github,
  Lock,
  Globe,
  Smartphone
} from 'lucide-react';

const Index = () => {
  const [isHovered, setIsHovered] = useState(false);

  const features = [
    {
      icon: <Upload className="h-8 w-8 text-primary" />,
      title: "Drag & Drop Upload",
      description: "Simply drag files into the browser for instant sharing. No complicated steps required."
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Secure P2P Transfer",
      description: "Files are transferred directly between devices using encrypted WebRTC connections."
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Lightning Fast",
      description: "Direct peer-to-peer transfers mean maximum speed without server bottlenecks."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Room-Based Sharing",
      description: "Create or join rooms with unique codes to share files with specific people."
    },
    {
      icon: <Link2 className="h-8 w-8 text-primary" />,
      title: "Share via URL",
      description: "Generate shareable links that others can use to connect and receive files."
    },
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      title: "Works Anywhere",
      description: "No installation required. Works in any modern browser on any device."
    }
  ];

  const fileTypes = [
    { icon: <FileText className="h-6 w-6" />, type: "Documents", formats: "PDF, DOC, TXT" },
    { icon: <Image className="h-6 w-6" />, type: "Images", formats: "JPG, PNG, GIF" },
    { icon: <Music className="h-6 w-6" />, type: "Audio", formats: "MP3, WAV, FLAC" },
    { icon: <Video className="h-6 w-6" />, type: "Videos", formats: "MP4, AVI, MOV" }
  ];

  const steps = [
    { step: "1", title: "Create Room", description: "Generate a unique room code" },
    { step: "2", title: "Share Code", description: "Send the code to your recipient" },
    { step: "3", title: "Drop Files", description: "Drag and drop files to share" },
    { step: "4", title: "Direct Transfer", description: "Files transfer peer-to-peer instantly" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/10 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
              Share Files
              <span className="text-primary block">Instantly & Securely</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Transfer files directly between devices using peer-to-peer technology. 
              No uploads, no storage, no limits - just fast, secure sharing.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/share">
              <Button size="lg" className="text-lg px-8 py-6 hover-scale">
                Start Sharing Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              <Github className="mr-2 h-5 w-5" />
              View Source
            </Button>
          </div>

          {/* Demo Animation */}
          <div 
            className="relative max-w-2xl mx-auto"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Card className={`transition-all duration-300 ${isHovered ? 'scale-105 shadow-2xl' : 'shadow-lg'}`}>
              <CardContent className="p-8">
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-12 bg-primary/5">
                  <Upload className={`h-16 w-16 mx-auto text-primary mb-4 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`} />
                  <p className="text-lg text-muted-foreground">Drop files here to share</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose Our P2P File Sharing?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built with modern web technologies for the fastest, most secure file sharing experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover-scale transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    {feature.icon}
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-secondary/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple, secure file sharing in just 4 steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* File Types */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Support for All File Types
            </h2>
            <p className="text-xl text-muted-foreground">
              Share any file format, any size - we handle them all
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {fileTypes.map((type, index) => (
              <Card key={index} className="text-center hover-scale transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4 text-primary">
                    {type.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{type.type}</h3>
                  <p className="text-sm text-muted-foreground">{type.formats}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-4xl mx-auto text-center">
          <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Your Privacy is Our Priority
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="flex flex-col items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-semibold mb-2">End-to-End Encryption</h3>
              <p className="text-muted-foreground text-sm">All transfers are encrypted using WebRTC protocols</p>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-semibold mb-2">No File Storage</h3>
              <p className="text-muted-foreground text-sm">Files never touch our servers - direct P2P transfer</p>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-semibold mb-2">No Account Required</h3>
              <p className="text-muted-foreground text-sm">Start sharing immediately without registration</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Share Files Securely?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who trust our P2P file sharing platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/share">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                <Upload className="mr-2 h-5 w-5" />
                Start Sharing Now
              </Button>
            </Link>
            <Link to="/share">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Download className="mr-2 h-5 w-5" />
                Receive Files
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-background border-t">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-foreground mb-4">Breezy File Share</h3>
              <p className="text-muted-foreground mb-4">
                The fastest, most secure way to share files peer-to-peer. 
                Built with modern web technologies for maximum privacy and performance.
              </p>
              <div className="flex space-x-4">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Works on all devices</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Features</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>Drag & Drop Upload</li>
                <li>P2P File Transfer</li>
                <li>Room-Based Sharing</li>
                <li>No File Size Limits</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Security</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>End-to-End Encryption</li>
                <li>No File Storage</li>
                <li>Privacy First</li>
                <li>Open Source</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground text-sm">
            <p>&copy; 2024 Breezy File Share. Built with WebRTC for secure P2P file sharing.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
