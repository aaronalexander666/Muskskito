import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { Link } from "wouter";

export default function Sessions() {
  const { isAuthenticated } = useAuth();
  const { data: sessions, isLoading, refetch } = trpc.browse.sessions.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: stats } = trpc.analytics.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isAuthenticated) {
      refetch();
    }
  }, [isAuthenticated, refetch]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative">
        <div className="cyber-grid"></div>
        <div className="relative z-10 container py-8">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Sessions History</h1>
            <p className="mb-6">Login to view your browsing sessions</p>
            <Button onClick={() => (window.location.href = getLoginUrl())}>Login</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="cyber-grid"></div>

      <div className="relative z-10 container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sessions History</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </CardContent>
            </Card>

            <Card className="glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-cyan-300">{stats.activeSessions}</p>
              </CardContent>
            </Card>

            <Card className="glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Safe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{stats.safeSessions}</p>
              </CardContent>
            </Card>

            <Card className="glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Dangerous</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{stats.dangerousSessions}</p>
              </CardContent>
            </Card>

            <Card className="glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Threats Detected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{stats.threatsDetected}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sessions List */}
        <Card className="glow">
          <CardHeader>
            <CardTitle>Browsing Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading sessions...</p>
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="border border-border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`status-dot ${session.threatLevel === "safe" ? "safe" : "danger"}`}></span>
                          <span className="font-semibold">{session.threatLevel.toUpperCase()}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            session.status === "active" ? "bg-cyan-500/20 text-cyan-300" : 
                            session.status === "terminated" ? "bg-destructive/20 text-destructive" : 
                            "bg-muted text-muted-foreground"
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground break-all">{session.url}</p>
                        {session.vpnLocation && (
                          <p className="text-xs text-cyan-300 mt-1">
                            VPN: {session.vpnLocation} ({session.vpnIp})
                          </p>
                        )}
                        {session.threatDetails && (
                          <div className="mt-2 text-xs bg-destructive/20 border border-destructive rounded p-2">
                            <p className="font-semibold">{session.threatDetails.type}</p>
                            <p>{session.threatDetails.description}</p>
                            <p className="opacity-80">Confidence: {session.threatDetails.confidence}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground ml-4">
                        <p>{new Date(session.startedAt!).toLocaleString()}</p>
                        {session.endedAt && (
                          <p className="mt-1">Ended: {new Date(session.endedAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No sessions yet. Start browsing to see your history!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

