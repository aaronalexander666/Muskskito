import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Settings() {
  const { isAuthenticated, user } = useAuth();
  const { data: settings, refetch } = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const updateSettings = trpc.settings.update.useMutation();

  const [autoDeleteSessions, setAutoDeleteSessions] = useState(true);
  const [deleteAfterMinutes, setDeleteAfterMinutes] = useState(30);
  const [blockTrackers, setBlockTrackers] = useState(true);
  const [blockAds, setBlockAds] = useState(true);
  const [blockMalware, setBlockMalware] = useState(true);
  const [enableAiAssistant, setEnableAiAssistant] = useState(true);
  const [threatSensitivity, setThreatSensitivity] = useState<"low" | "medium" | "high">("medium");

  useEffect(() => {
    if (settings) {
      setAutoDeleteSessions(settings.autoDeleteSessions);
      setDeleteAfterMinutes(settings.deleteAfterMinutes);
      setBlockTrackers(settings.blockTrackers);
      setBlockAds(settings.blockAds);
      setBlockMalware(settings.blockMalware);
      setEnableAiAssistant(settings.enableAiAssistant);
      setThreatSensitivity(settings.threatSensitivity);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        autoDeleteSessions,
        deleteAfterMinutes,
        blockTrackers,
        blockAds,
        blockMalware,
        enableAiAssistant,
        threatSensitivity,
      });
      
      toast.success("Settings saved successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative">
        <div className="cyber-grid"></div>
        <div className="relative z-10 container py-8">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Settings</h1>
            <p className="mb-6">Login to manage your settings</p>
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
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Subscription: <span className="text-primary font-semibold">{user?.subscriptionTier?.toUpperCase()}</span>
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        {/* Privacy Settings */}
        <Card className="glow">
          <CardHeader>
            <CardTitle>Privacy & Security</CardTitle>
            <CardDescription>Control how your browsing data is handled</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-delete">Auto-Delete Sessions</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically delete browsing sessions after a set time
                </p>
              </div>
              <Switch
                id="auto-delete"
                checked={autoDeleteSessions}
                onCheckedChange={setAutoDeleteSessions}
              />
            </div>

            {autoDeleteSessions && (
              <div className="space-y-2">
                <Label htmlFor="delete-time">Delete After (minutes)</Label>
                <Input
                  id="delete-time"
                  type="number"
                  min="5"
                  max="1440"
                  value={deleteAfterMinutes}
                  onChange={(e) => setDeleteAfterMinutes(parseInt(e.target.value))}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="block-trackers">Block Trackers</Label>
                <p className="text-sm text-muted-foreground">
                  Prevent websites from tracking your activity
                </p>
              </div>
              <Switch
                id="block-trackers"
                checked={blockTrackers}
                onCheckedChange={setBlockTrackers}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="block-ads">Block Advertisements</Label>
                <p className="text-sm text-muted-foreground">
                  Remove ads and sponsored content
                </p>
              </div>
              <Switch
                id="block-ads"
                checked={blockAds}
                onCheckedChange={setBlockAds}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="block-malware">Block Malware</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically block known malicious sites
                </p>
              </div>
              <Switch
                id="block-malware"
                checked={blockMalware}
                onCheckedChange={setBlockMalware}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant Settings */}
        <Card className="glow">
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>Configure your browsing AI helper</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-ai">Enable AI Assistant</Label>
                <p className="text-sm text-muted-foreground">
                  Get real-time security advice while browsing
                </p>
              </div>
              <Switch
                id="enable-ai"
                checked={enableAiAssistant}
                onCheckedChange={setEnableAiAssistant}
              />
            </div>

            <div className="space-y-2">
              <Label>Threat Sensitivity</Label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((level) => (
                  <Button
                    key={level}
                    variant={threatSensitivity === level ? "default" : "outline"}
                    onClick={() => setThreatSensitivity(level)}
                    className="flex-1"
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Higher sensitivity may flag more sites as potentially dangerous
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateSettings.isPending} size="lg">
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}

