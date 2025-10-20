import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Settings, Shield, Zap, MessageSquare, Crown, Globe, MapPin, Server } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Enhanced 3D Globe with detailed VPN visualization
function Globe3D({ vpnActive, vpnLocation }: { vpnActive: boolean; vpnLocation?: { latitude: string; longitude: string; country: string; city: string } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = 450;

    let rotation = 0;
    let animationFrame: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 120;

      // Draw outer glow
      const gradient = ctx.createRadialGradient(centerX, centerY, radius - 20, centerX, centerY, radius + 30);
      gradient.addColorStop(0, "rgba(0, 255, 65, 0.1)");
      gradient.addColorStop(1, "rgba(0, 255, 65, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw globe wireframe with more detail
      ctx.strokeStyle = "rgba(0, 255, 65, 0.4)";
      ctx.lineWidth = 1.5;

      // Latitude lines (more lines for detail)
      for (let i = -5; i <= 5; i++) {
        const y = centerY + (i * radius) / 5;
        const latRadius = Math.sqrt(radius * radius - ((i * radius) / 5) ** 2);
        ctx.beginPath();
        ctx.ellipse(centerX, y, latRadius, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Longitude lines (more lines for detail)
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 12 + rotation;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * Math.abs(Math.cos(angle)), radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw equator line (highlighted)
      ctx.strokeStyle = "rgba(0, 255, 65, 0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius, 10, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Draw VPN location marker if connected
      if (vpnActive && vpnLocation) {
        const lat = parseFloat(vpnLocation.latitude);
        const lon = parseFloat(vpnLocation.longitude);
        
        // Convert lat/lon to 3D position with rotation
        const latRad = (lat * Math.PI) / 180;
        const lonRad = ((lon + rotation * 50) * Math.PI) / 180;
        
        const x = centerX + radius * Math.cos(latRad) * Math.sin(lonRad);
        const y = centerY - radius * Math.sin(latRad);
        const z = radius * Math.cos(latRad) * Math.cos(lonRad);

        // Only draw if marker is on visible side of globe
        if (z > 0) {
          // Draw connection line from center
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = "rgba(0, 255, 65, 0.3)";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw pulsing marker
          const pulse = Math.sin(Date.now() / 200) * 6 + 12;
          ctx.beginPath();
          ctx.arc(x, y, pulse, 0, Math.PI * 2);
          ctx.fillStyle = "#00ff41";
          ctx.shadowBlur = 25;
          ctx.shadowColor = "#00ff41";
          ctx.fill();

          // Draw inner marker
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.shadowBlur = 15;
          ctx.fill();

          // Draw location label with background
          ctx.shadowBlur = 0;
          const labelText = `${vpnLocation.city}, ${vpnLocation.country}`;
          ctx.font = "bold 14px monospace";
          const textWidth = ctx.measureText(labelText).width;
          
          // Label background
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          ctx.fillRect(x + 20, y - 25, textWidth + 10, 20);
          
          // Label border
          ctx.strokeStyle = "#00ff41";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 20, y - 25, textWidth + 10, 20);
          
          // Label text
          ctx.fillStyle = "#00ff41";
          ctx.fillText(labelText, x + 25, y - 10);
        }
      }

      // Draw center dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 255, 65, 0.5)";
      ctx.fill();

      if (vpnActive) {
        rotation += 0.003; // Slower rotation for better visibility
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrame);
  }, [vpnActive, vpnLocation]);

  return <canvas ref={canvasRef} className="w-full h-[450px]" />;
}

// AI Chat Interface
function AIChat({ sessionId, enabled }: { sessionId: string | null; enabled: boolean }) {
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: (response: any) => {
      setMessages((prev) => [...prev, { role: "assistant", content: response.message }]);
      setMessage("");
    },
  });

  const handleSend = () => {
    if (!message.trim() || !sessionId) return;
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    sendMessage.mutate({ sessionId, message });
  };

  if (!enabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <Card className="w-96 h-[500px] flex flex-col bg-black/95 border-[#00ff41]">
          <CardHeader className="border-b border-[#00ff41]/30">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#00ff41] flex items-center gap-2">
                <Shield className="h-5 w-5" />
                AI Security Assistant
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-[#00ff41]/60 text-sm">
                Ask me about security threats, safe browsing practices, or any suspicious activity...
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded ${
                  msg.role === "user"
                    ? "bg-[#00ff41]/10 ml-8 border border-[#00ff41]/30"
                    : "bg-black/50 mr-8 border border-[#00ff41]/20"
                }`}
              >
                <div className="text-xs text-[#00ff41]/70 mb-1">
                  {msg.role === "user" ? "You" : "AI Assistant"}
                </div>
                <div className="text-[#00ff41] text-sm">{msg.content}</div>
              </div>
            ))}
          </CardContent>
          <div className="p-4 border-t border-[#00ff41]/30">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about security..."
                className="bg-black border-[#00ff41]/30 text-[#00ff41]"
              />
              <Button onClick={handleSend} disabled={sendMessage.isPending} className="bg-[#00ff41] text-black hover:bg-[#00ff41]/80">
                Send
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-16 w-16 shadow-lg bg-[#00ff41] text-black hover:bg-[#00ff41]/80 border-2 border-[#00ff41]"
        >
          <MessageSquare className="h-7 w-7" />
        </Button>
      )}
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [vpnStatus, setVpnStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [threatLevel, setThreatLevel] = useState<"safe" | "danger">("safe");
  const [sessionActive, setSessionActive] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedVpnId, setSelectedVpnId] = useState<string>("");
  const [threatDetails, setThreatDetails] = useState<{
    type: string;
    description: string;
    confidence: string;
  } | null>(null);
  const [vpnConnection, setVpnConnection] = useState<{
    ip: string;
    city: string;
    country: string;
    countryCode: string;
    latitude: string;
    longitude: string;
    latency: string;
    locationId: string;
  } | null>(null);

  const { data: settings } = trpc.settings.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: vpnLocations } = trpc.vpn.locations.useQuery(undefined, { enabled: isAuthenticated });
  const connectVpnMutation = trpc.vpn.connect.useMutation();
  const scanUrlMutation = trpc.browse.scan.useMutation();
  const startSessionMutation = trpc.browse.start.useMutation();
  const nukeSessionMutation = trpc.browse.nuke.useMutation();

  // Count unique countries
  const uniqueCountries = vpnLocations ? new Set(vpnLocations.map((loc: any) => loc.country)).size : 0;
  const totalLocations = vpnLocations?.length || 0;

  const connectVPN = async () => {
    if (!selectedVpnId) {
      toast.error("Please select a VPN location");
      return;
    }

    setVpnStatus("connecting");
    
    try {
      const result = await connectVpnMutation.mutateAsync({ locationId: selectedVpnId });
      setVpnConnection(result);
      setVpnStatus("connected");
      toast.success(`Connected to ${result.city}, ${result.country}`);
    } catch (error) {
      console.error("VPN connection failed:", error);
      setVpnStatus("disconnected");
      toast.error("VPN connection failed");
    }
  };

  const scanUrl = async (url: string) => {
    // Validate URL format
    if (!url || !url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Add protocol if missing
    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    // Validate URL format
    try {
      new URL(validUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setScanProgress(0);
    setThreatDetails(null);

    for (let i = 0; i <= 100; i += 10) {
      setScanProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      const result = await scanUrlMutation.mutateAsync({ url: validUrl });
      setThreatLevel(result.threatLevel as "safe" | "danger");
      setThreatDetails(result.threatDetails || null);
    } catch (error) {
      console.error("URL scan failed:", error);
      setThreatLevel("safe");
      toast.error("URL scan failed");
    }
  };

  const startSession = async () => {
    if (!urlInput || !urlInput.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    // Add protocol if missing
    let validUrl = urlInput.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    // Validate URL format
    try {
      new URL(validUrl);
    } catch {
      toast.error("Please enter a valid URL (e.g., example.com or https://example.com)");
      return;
    }

    // Update the input with the valid URL
    setUrlInput(validUrl);

    await scanUrl(validUrl);

    try {
      const result = await startSessionMutation.mutateAsync({
        url: validUrl,
        vpnIp: vpnConnection?.ip,
        vpnLocation: vpnConnection ? `${vpnConnection.city}, ${vpnConnection.country}` : undefined,
        vpnCountry: vpnConnection?.country,
        vpnLatitude: vpnConnection?.latitude,
        vpnLongitude: vpnConnection?.longitude,
      });

      setCurrentSessionId(result.sessionId);
      setThreatLevel(result.threatLevel as "safe" | "danger");
      setThreatDetails(result.threatDetails || null);
      setSessionActive(true);
      toast.success("Secure browsing session started");
    } catch (error) {
      console.error("Session start failed:", error);
      toast.error("Failed to start session");
    }
  };

  const nukeSession = async () => {
    if (!currentSessionId) return;

    try {
      await nukeSessionMutation.mutateAsync({ sessionId: currentSessionId });
      setSessionActive(false);
      setCurrentSessionId(null);
      setUrlInput("");
      setThreatLevel("safe");
      setThreatDetails(null);
      toast.success("Session destroyed - all data wiped");
    } catch (error) {
      console.error("Nuke failed:", error);
      toast.error("Failed to destroy session");
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#00ff41] relative overflow-hidden">
      {/* Animated grid background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(#00ff41 1px, transparent 1px),
            linear-gradient(90deg, #00ff41 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[#00ff41]/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-[#00ff41]" />
            <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/sessions">
              <Button variant="outline" className="border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/10">
                <Server className="mr-2 h-4 w-4" />
                Sessions
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/10">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Link href="/pro">
              <Button className="bg-[#00ff41] text-black hover:bg-[#00ff41]/80">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold mb-2 tracking-wider">Muskskito - Disposable AI Browser</h2>
          <p className="text-[#00ff41]/70 text-lg">Browse Safe, Leave No Trace</p>
        </div>

        {/* VPN Status and Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-black/80 border-[#00ff41]/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-[#00ff41] flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quantum Tunnel Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    vpnStatus === "connected"
                      ? "bg-[#00ff41] animate-pulse"
                      : vpnStatus === "connecting"
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                />
                <span className="font-mono">
                  Status: {vpnStatus === "connected" ? "CONNECTED" : vpnStatus === "connecting" ? "CONNECTING..." : "DISCONNECTED"}
                </span>
              </div>

              {vpnConnection && vpnStatus === "connected" && (
                <div className="space-y-2 font-mono text-sm border border-[#00ff41]/30 p-3 rounded bg-black/50">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Location: {vpnConnection.city}, {vpnConnection.country}</span>
                  </div>
                  <div>Masked IP: {vpnConnection.ip}</div>
                  <div>Latency: {vpnConnection.latency}ms</div>
                  <div>Coordinates: {vpnConnection.latitude}, {vpnConnection.longitude}</div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Available Locations:
                  </span>
                  <span className="font-bold">{totalLocations} servers in {uniqueCountries} countries</span>
                </div>

                <Select value={selectedVpnId} onValueChange={setSelectedVpnId}>
                  <SelectTrigger className="bg-black border-[#00ff41]/30 text-[#00ff41]">
                    <SelectValue placeholder="Select VPN Location" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-[#00ff41]/30">
                    {vpnLocations?.map((location: any) => (
                      <SelectItem
                        key={location.id}
                        value={location.id}
                        className="text-[#00ff41] focus:bg-[#00ff41]/10 focus:text-[#00ff41]"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{location.city}, {location.country}</span>
                          {location.isPro && (
                            <Crown className="h-3 w-3 ml-2 text-yellow-500" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={connectVPN}
                  disabled={vpnStatus === "connecting" || !selectedVpnId}
                  className="w-full bg-[#00ff41] text-black hover:bg-[#00ff41]/80 font-bold"
                >
                  {vpnStatus === "connecting" ? "Connecting..." : vpnStatus === "connected" ? "Reconnect VPN" : "Activate VPN"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Threat Analysis */}
          <Card className="bg-black/80 border-[#00ff41]/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-[#00ff41] flex items-center gap-2">
                <Shield className="h-5 w-5" />
                AI Threat Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    threatLevel === "safe" ? "bg-[#00ff41] animate-pulse" : "bg-red-500 animate-pulse"
                  }`}
                />
                <span className="font-mono">Threat Level: {threatLevel.toUpperCase()}</span>
              </div>

              {scanProgress > 0 && scanProgress < 100 && (
                <div className="space-y-2">
                  <div className="text-sm font-mono">Scanning URL...</div>
                  <Progress value={scanProgress} className="bg-black border border-[#00ff41]/30" />
                </div>
              )}

              {threatDetails && (
                <div className="space-y-2 font-mono text-sm border border-[#00ff41]/30 p-3 rounded bg-black/50">
                  <div>Type: {threatDetails.type}</div>
                  <div>Description: {threatDetails.description}</div>
                  <div>Confidence: {threatDetails.confidence}</div>
                </div>
              )}

              {!threatDetails && scanProgress === 0 && (
                <div className="text-[#00ff41]/60 text-sm font-mono">
                  Enter a URL below to begin threat analysis...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secure Browse Command */}
        <Card className="bg-black/80 border-[#00ff41]/30 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-[#00ff41] font-mono">Secure Browse Command</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startSession()}
                placeholder="Enter URL to browse safely..."
                className="flex-1 bg-black border-[#00ff41]/50 text-[#00ff41] placeholder:text-[#00ff41]/40 font-mono"
                disabled={sessionActive}
              />
              {!sessionActive ? (
                <Button
                  onClick={startSession}
                  className="bg-[#00ff41] text-black hover:bg-[#00ff41]/80 font-bold px-8"
                >
                  Launch Sandbox
                </Button>
              ) : (
                <>
                  <Button disabled className="bg-[#00ff41]/50 text-black font-bold px-8">
                    Session Active
                  </Button>
                  <Button
                    onClick={nukeSession}
                    className="bg-red-600 text-white hover:bg-red-700 font-bold px-8"
                  >
                    NUKE SESSION
                  </Button>
                </>
              )}
            </div>

            {sessionActive && currentSessionId && (
              <div className="border border-[#00ff41]/30 rounded-lg overflow-hidden bg-black/50">
                <div className="bg-[#00ff41]/10 p-2 border-b border-[#00ff41]/30 flex items-center justify-between">
                  <span className="text-xs font-mono">SANDBOXED ENVIRONMENT - SESSION: {currentSessionId.slice(0, 8)}</span>
                  <span className="text-xs font-mono">ISOLATED | ENCRYPTED | DISPOSABLE</span>
                </div>
                <iframe
                  src={urlInput}
                  className="w-full h-[600px] bg-white"
                  sandbox="allow-scripts allow-same-origin"
                  title="Secure Browser"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced 3D Globe */}
        <Card className="bg-black/80 border-[#00ff41]/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-[#00ff41] flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Global VPN Network
              {vpnConnection && (
                <span className="text-sm font-normal ml-auto">
                  Connected: {vpnConnection.city}, {vpnConnection.country}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Globe3D 
              vpnActive={vpnStatus === "connected"} 
              vpnLocation={vpnConnection ? {
                latitude: vpnConnection.latitude,
                longitude: vpnConnection.longitude,
                country: vpnConnection.country,
                city: vpnConnection.city
              } : undefined}
            />
          </CardContent>
        </Card>
      </main>

      {/* AI Chat Assistant */}
      <AIChat sessionId={currentSessionId} enabled={settings?.enableAiAssistant ?? true} />

      <style>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </div>
  );
}

