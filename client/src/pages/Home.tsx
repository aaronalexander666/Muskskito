import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

// Earth 3D Visualization Component
function Earth3D({ vpnActive }: { vpnActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = 300;

    let rotation = 0;
    let animationFrame: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 80;

      // Draw wireframe sphere
      ctx.strokeStyle = "rgba(0, 255, 65, 0.3)";
      ctx.lineWidth = 1;

      // Latitude lines
      for (let i = -2; i <= 2; i++) {
        const y = centerY + (i * radius) / 2.5;
        const width = Math.sqrt(radius * radius - ((i * radius) / 2.5) ** 2) * 2;
        ctx.beginPath();
        ctx.ellipse(centerX, y, width / 2, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Longitude lines
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 6 + rotation;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * Math.abs(Math.cos(angle)), radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (vpnActive) {
        rotation += 0.01;
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrame);
  }, [vpnActive]);

  return <canvas ref={canvasRef} className="w-full h-[300px]" />;
}

// VPN Tunnel Visualization
function VPNTunnel({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !active) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = 200;

    let animationFrame: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw glowing path
      ctx.beginPath();
      ctx.moveTo(50, 100);
      ctx.bezierCurveTo(150, 50, canvas.width - 150, 150, canvas.width - 50, 100);
      ctx.strokeStyle = "#00ff41";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00ff41";
      ctx.stroke();

      // Draw nodes
      [100, canvas.width / 2, canvas.width - 100].forEach((x) => {
        ctx.beginPath();
        ctx.arc(x, 100, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#00ff41";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00ff41";
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrame);
  }, [active]);

  return <canvas ref={canvasRef} className="w-full h-[200px]" />;
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
  const [vpnIP, setVpnIP] = useState<string | null>(null);
  const [vpnLocation, setVpnLocation] = useState<string | null>(null);
  const [latency, setLatency] = useState<string | null>(null);

  // tRPC mutations
  const connectVpnMutation = trpc.vpn.connect.useMutation();
  const scanUrlMutation = trpc.browse.scan.useMutation();
  const startSessionMutation = trpc.browse.start.useMutation();
  const nukeSessionMutation = trpc.browse.nuke.useMutation();

  // VPN connection
  const connectVPN = async () => {
    setVpnStatus("connecting");
    
    try {
      const result = await connectVpnMutation.mutateAsync({});
      setVpnIP(result.ip);
      setVpnLocation(`${result.city}, ${result.country}`);
      setLatency(result.latency);
      setVpnStatus("connected");
    } catch (error) {
      console.error("VPN connection failed:", error);
      setVpnStatus("disconnected");
    }
  };

  // URL scanning with progress
  const scanUrl = async (url: string) => {
    setScanProgress(0);
    setThreatDetails(null);

    // Animate progress
    for (let i = 0; i <= 100; i += 10) {
      setScanProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      const result = await scanUrlMutation.mutateAsync({ url });
      setThreatLevel(result.threatLevel);
      setThreatDetails(result.threatDetails || null);
    } catch (error) {
      console.error("URL scan failed:", error);
      setThreatLevel("safe");
    }
  };

  // Start browsing session
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
        vpnIp: vpnIP || undefined,
        vpnLocation: vpnLocation || undefined,
      });

      setCurrentSessionId(result.sessionId);
      setThreatLevel(result.threatLevel as "safe" | "danger");
      setThreatDetails(result.threatDetails || null);
      setSessionActive(true);
    } catch (error) {
      console.error("Session start failed:", error);
    }
  };

  // Terminate session
  const nukeSession = async () => {
    if (currentSessionId) {
      try {
        await nukeSessionMutation.mutateAsync({ sessionId: currentSessionId });
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

  return (
    <div className="min-h-screen relative">
      {/* Cyberpunk Grid Background */}
      <div className="cyber-grid"></div>

      <div className="relative z-10 container py-8 space-y-6">
        {/* Header */}
        <header className="text-center py-8">
          <div className="flex justify-end mb-4">
            {isAuthenticated && (
              <Link href="/sessions">
                <Button variant="outline">View Sessions</Button>
              </Link>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold pulse mb-2">{APP_TITLE}</h1>
          <p className="text-sm opacity-70">Browse Safe, Leave No Trace</p>
          {!isAuthenticated && (
            <div className="mt-4">
              <Button onClick={() => window.location.href = getLoginUrl()}>
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
                  <CardTitle>Quantum Tunnel Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <span className={`status-dot ${vpnStatus === "connected" ? "safe" : "danger"}`}></span>
                    <span>Status: {vpnStatus.toUpperCase()}</span>
                  </div>

                  {vpnStatus === "connected" ? (
                    <div className="space-y-2 text-sm">
                      <p>
                        Real IP: <span className="line-through text-destructive">192.168.1.1</span>
                      </p>
                      <p>
                        VPN IP: <span className="text-cyan-300">{vpnIP}</span>
                      </p>
                      <p>Location: {vpnLocation}</p>
                      <p>Latency: {latency}</p>
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
                  <CardTitle>AI Threat Analysis</CardTitle>
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

            {/* Earth Visualization */}
            <div className="w-full">
              <Earth3D vpnActive={vpnStatus === "connected"} />
            </div>

            {/* VPN Tunnel Visualization */}
            {vpnStatus === "connected" && (
              <div className="w-full">
                <VPNTunnel active={true} />
              </div>
            )}

            {/* Sandbox */}
            {sessionActive && (
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/10 pointer-events-none z-10"></div>
                <iframe src={urlInput} className="w-full h-[400px]" sandbox="allow-same-origin" title="Sandboxed Browser"></iframe>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

