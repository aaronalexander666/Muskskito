import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Settings, Shield, Zap, MessageSquare, Crown } from "lucide-react";
import { toast } from "sonner";

// Enhanced 3D Globe with VPN location markers
function Globe3D({ vpnActive, vpnLocation }: { vpnActive: boolean; vpnLocation?: { latitude: string; longitude: string; country: string } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = 400;

    let rotation = 0;
    let animationFrame: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 100;

      // Draw globe wireframe
      ctx.strokeStyle = "rgba(0, 255, 65, 0.3)";
      ctx.lineWidth = 1;

      // Latitude lines
      for (let i = -3; i <= 3; i++) {
        const y = centerY + (i * radius) / 3.5;
        const width = Math.sqrt(radius * radius - ((i * radius) / 3.5) ** 2) * 2;
        ctx.beginPath();
        ctx.ellipse(centerX, y, width / 2, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Longitude lines
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 8 + rotation;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * Math.abs(Math.cos(angle)), radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw VPN location marker if connected
      if (vpnActive && vpnLocation) {
        const lat = parseFloat(vpnLocation.latitude);
        const lon = parseFloat(vpnLocation.longitude);
        
        // Convert lat/lon to 2D position (simplified projection)
        const x = centerX + (lon / 180) * radius * Math.cos(rotation);
        const y = centerY - (lat / 90) * radius;

        // Draw pulsing marker
        const pulse = Math.sin(Date.now() / 200) * 5 + 10;
        ctx.beginPath();
        ctx.arc(x, y, pulse, 0, Math.PI * 2);
        ctx.fillStyle = "#00ff41";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00ff41";
        ctx.fill();

        // Draw location label
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#00ff41";
        ctx.font = "12px monospace";
        ctx.fillText(vpnLocation.country, x + 15, y - 10);
      }

      if (vpnActive) {
        rotation += 0.005;
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrame);
  }, [vpnActive, vpnLocation]);

  return <canvas ref={canvasRef} className="w-full h-[400px]" />;
}

// AI Chat Interface
function AIChat({ sessionId, enabled }: { sessionId: string | null; enabled: boolean }) {
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data: messages, refetch } = trpc.chat.messages.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId && enabled }
  );
  const sendMessage = trpc.chat.send.useMutation();

  const handleSend = async () => {
    if (!message.trim() || !sessionId) return;

    try {
      await sendMessage.mutateAsync({
        sessionId,
        message,
      });
      setMessage("");
      refetch();
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    }
  };

  if (!enabled || !sessionId) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-96 h-[500px] flex flex-col glow">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI Security Assistant
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>✕</Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3 p-4">
            <div className="flex-1 overflow-y-auto space-y-3">
              {messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-primary/20 ml-8"
                      : "bg-muted mr-8"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about security..."
              />
              <Button onClick={handleSend} disabled={sendMessage.isPending}>
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
        >
          <MessageSquare className="h-6 w-6" />
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
  const connectVpnMutation = trpc.vpn.connect.useMutation();
  const scanUrlMutation = trpc.browse.scan.useMutation();
  const startSessionMutation = trpc.browse.start.useMutation();
  const nukeSessionMutation = trpc.browse.nuke.useMutation();

  const connectVPN = async () => {
    setVpnStatus("connecting");
    
    try {
      const result = await connectVpnMutation.mutateAsync({});
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
    setScanProgress(0);
    setThreatDetails(null);

    for (let i = 0; i <= 100; i += 10) {
      setScanProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      const result = await scanUrlMutation.mutateAsync({ url });
      setThreatLevel(result.threatLevel as "safe" | "danger");
      setThreatDetails(result.threatDetails || null);
    } catch (error) {
      console.error("URL scan failed:", error);
      setThreatLevel("safe");
    }
  };

  const startSession = async () => {
    if (!urlInput || !isAuthenticated) {
      if (!isAuthenticated) {
        window.location.href = getLoginUrl();
      }
      return;
    }

    await scanUrl(urlInput);

    try {
      const result = await startSessionMutation.mutateAsync({
        url: urlInput,
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
    if (currentSessionId) {
      try {
        await nukeSessionMutation.mutateAsync({ sessionId: currentSessionId });
        toast.success("Session deleted - all traces removed");
      } catch (error) {
        console.error("Session termination failed:", error);
      }
    }

    setSessionActive(false);
    setCurrentSessionId(null);
    setUrlInput("");
    setThreatDetails(null);
    setThreatLevel("safe");
    setScanProgress(0);
  };

  const isPro = user?.subscriptionTier === "pro";

  return (
    <div className="min-h-screen relative">
      <div className="cyber-grid"></div>

      <div className="relative z-10 container py-8 space-y-6">
        {/* Header */}
        <header className="text-center py-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              {isAuthenticated && (
                <>
                  <Link href="/settings">
                    <Button variant="outline" size="icon">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/sessions">
                    <Button variant="outline">
                      <Shield className="h-5 w-5 mr-2" />
                      Sessions
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <div>
              {isAuthenticated && !isPro && (
                <Link href="/pro">
                  <Button className="bg-gradient-to-r from-primary to-cyan-400">
                    <Crown className="h-5 w-5 mr-2" />
                    Upgrade to Pro
                  </Button>
                </Link>
              )}
              {isPro && (
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full">
                  <Crown className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">PRO</span>
                </div>
              )}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold pulse mb-2">{APP_TITLE}</h1>
          <p className="text-sm opacity-70">Browse Safe, Leave No Trace</p>
          {!isAuthenticated && (
            <div className="mt-4">
              <Button onClick={() => window.location.href = getLoginUrl()} size="lg">
                Login to Start
              </Button>
            </div>
          )}
        </header>

        {isAuthenticated && (
          <>
            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VPN Panel */}
              <Card className="glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quantum Tunnel Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <span className={`status-dot ${vpnStatus === "connected" ? "safe" : "danger"}`}></span>
                    <span>Status: {vpnStatus.toUpperCase()}</span>
                  </div>

                  {vpnStatus === "connected" && vpnConnection ? (
                    <div className="space-y-2 text-sm">
                      <p>
                        Real IP: <span className="line-through text-destructive">192.168.1.1</span>
                      </p>
                      <p>
                        VPN IP: <span className="text-cyan-300">{vpnConnection.ip}</span>
                      </p>
                      <p>Location: {vpnConnection.city}, {vpnConnection.country}</p>
                      <p>Latency: {vpnConnection.latency}</p>
                    </div>
                  ) : (
                    <Button onClick={connectVPN} disabled={vpnStatus === "connecting"} className="w-full">
                      {vpnStatus === "connecting" ? "Connecting..." : "Activate VPN"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Threat Analysis Panel */}
              <Card className="glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    AI Threat Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <span className={`status-dot ${threatLevel === "safe" ? "safe" : "danger"}`}></span>
                    <span>Threat Level: {threatLevel.toUpperCase()}</span>
                  </div>

                  {scanProgress > 0 && scanProgress < 100 && (
                    <div className="space-y-2">
                      <Progress value={scanProgress} className="h-2" />
                      <p className="text-xs">Scanning... {scanProgress}%</p>
                    </div>
                  )}

                  {threatDetails && (
                    <div className="border border-destructive bg-destructive/20 p-4 rounded-lg space-y-2">
                      <h4 className="text-destructive font-semibold">{threatDetails.type}</h4>
                      <p className="text-sm">{threatDetails.description}</p>
                      <p className="text-xs opacity-80">Confidence: {threatDetails.confidence}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* URL Input */}
            <Card className="glow">
              <CardHeader>
                <CardTitle>Secure Browse Command</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter URL to browse safely..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && !sessionActive && startSession()}
                  />
                  <Button onClick={startSession} disabled={!urlInput || sessionActive}>
                    {sessionActive ? "Session Active" : "Launch Sandbox"}
                  </Button>
                  {sessionActive && (
                    <Button onClick={nukeSession} variant="destructive">
                      NUKE SESSION
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 3D Globe */}
            <div className="w-full">
              <Globe3D 
                vpnActive={vpnStatus === "connected"} 
                vpnLocation={vpnConnection ? {
                  latitude: vpnConnection.latitude,
                  longitude: vpnConnection.longitude,
                  country: vpnConnection.country,
                } : undefined}
              />
            </div>

            {/* Sandbox */}
            {sessionActive && (
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/10 pointer-events-none z-10"></div>
                <iframe 
                  src={urlInput} 
                  className="w-full h-[400px]" 
                  sandbox="allow-same-origin" 
                  title="Sandboxed Browser"
                ></iframe>
              </Card>
            )}
          </>
        )}
      </div>

      {/* AI Chat Assistant */}
      <AIChat 
        sessionId={currentSessionId} 
        enabled={isAuthenticated && (settings?.enableAiAssistant ?? true)}
      />
    </div>
  );
}

