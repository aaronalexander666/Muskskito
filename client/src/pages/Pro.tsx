import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Check } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Pro() {
  const { isAuthenticated, user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<1 | 3 | 12>(1);
  const createPayment = trpc.subscription.createPayment.useMutation();
  const confirmPayment = trpc.subscription.confirmPayment.useMutation();

  const plans = [
    { months: 1, price: 9.99, save: 0 },
    { months: 3, price: 8.99, save: 10 },
    { months: 12, price: 6.99, save: 30 },
  ];

  const handleUpgrade = async () => {
    try {
      // Create payment
      const payment = await createPayment.mutateAsync({
        tier: "pro",
        months: selectedPlan,
      });

      // Simulate payment confirmation (in production, this would redirect to payment gateway)
      await confirmPayment.mutateAsync({
        paymentId: payment.paymentId,
      });

      toast.success("Successfully upgraded to Pro!");
      window.location.href = "/";
    } catch (error) {
      toast.error("Payment failed. Please try again.");
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative">
        <div className="cyber-grid"></div>
        <div className="relative z-10 container py-8">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Upgrade to Pro</h1>
            <p className="mb-6">Login to upgrade your account</p>
            <Button onClick={() => (window.location.href = getLoginUrl())}>Login</Button>
          </div>
        </div>
      </div>
    );
  }

  if (user?.subscriptionTier === "pro") {
    return (
      <div className="min-h-screen relative">
        <div className="cyber-grid"></div>
        <div className="relative z-10 container py-8">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold mb-4 text-primary">You're Already Pro!</h1>
            <p className="mb-6">Enjoy unlimited access to all premium features</p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="cyber-grid"></div>

      <div className="relative z-10 container py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Upgrade to <span className="text-primary">Pro</span></h1>
          <p className="text-lg text-muted-foreground">Unlock advanced security and privacy features</p>
        </div>

        {/* Features Comparison */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Tier */}
          <Card className="glow">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Basic protection</CardDescription>
              <div className="text-3xl font-bold mt-4">$0<span className="text-sm font-normal">/month</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span>8 VPN locations</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span>Basic threat detection</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span>Auto-delete sessions</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span>AI browsing assistant</span>
              </div>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className="glow border-primary border-2 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black px-4 py-1 rounded-full text-sm font-bold">
              RECOMMENDED
            </div>
            <CardHeader>
              <CardTitle className="text-primary">Pro</CardTitle>
              <CardDescription>Maximum security</CardDescription>
              <div className="text-3xl font-bold mt-4">
                ${plans.find(p => p.months === selectedPlan)?.price}
                <span className="text-sm font-normal">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span className="font-semibold">24 VPN locations worldwide</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span className="font-semibold">Advanced AI threat analysis</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span className="font-semibold">Priority VPN servers</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span className="font-semibold">Enhanced malware protection</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span className="font-semibold">Ad & tracker blocking</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span className="font-semibold">Unlimited browsing sessions</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span className="font-semibold">Priority support</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Plans */}
        <Card className="glow max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Choose Your Plan</CardTitle>
            <CardDescription>Save more with longer subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.months}
                  onClick={() => setSelectedPlan(plan.months as 1 | 3 | 12)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPlan === plan.months
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-sm text-muted-foreground">{plan.months} {plan.months === 1 ? "Month" : "Months"}</div>
                  <div className="text-2xl font-bold mt-1">${plan.price}</div>
                  <div className="text-xs text-muted-foreground">/month</div>
                  {plan.save > 0 && (
                    <div className="text-xs text-primary font-semibold mt-2">Save {plan.save}%</div>
                  )}
                </button>
              ))}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>${(plans.find(p => p.months === selectedPlan)!.price * selectedPlan).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${(plans.find(p => p.months === selectedPlan)!.price * selectedPlan).toFixed(2)}</span>
              </div>
            </div>

            <Button 
              onClick={handleUpgrade} 
              disabled={createPayment.isPending || confirmPayment.isPending}
              className="w-full" 
              size="lg"
            >
              {createPayment.isPending || confirmPayment.isPending ? "Processing..." : "Upgrade to Pro"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment processing. Cancel anytime.
            </p>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="text-center">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

