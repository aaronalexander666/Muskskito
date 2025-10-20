import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getVpnLocations, 
  createSession, 
  getUserSessions, 
  getSession, 
  updateSession,
  createThreat,
  getSessionThreats,
  getUserThreats
} from "./db";
import { randomUUID } from "crypto";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  vpn: router({
    // Get available VPN locations
    locations: protectedProcedure.query(async () => {
      const locations = await getVpnLocations();
      return locations;
    }),

    // Simulate VPN connection
    connect: protectedProcedure
      .input(z.object({
        locationId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Simulate VPN connection
        const locations = await getVpnLocations();
        
        // Default to Stockholm if no locations in DB
        const defaultLocation = {
          country: "Sweden",
          city: "Stockholm",
          ip: "185.156.45.78",
          latency: "24ms",
        };

        if (locations.length === 0) {
          return defaultLocation;
        }

        const location = locations[0];
        const randomIp = location.ipPool[Math.floor(Math.random() * location.ipPool.length)];
        const latency = Math.floor(Math.random() * (location.latencyMax - location.latencyMin)) + location.latencyMin;

        return {
          country: location.country,
          city: location.city,
          ip: randomIp,
          latency: `${latency}ms`,
        };
      }),

    // Disconnect VPN
    disconnect: protectedProcedure.mutation(async () => {
      return { success: true };
    }),
  }),

  browse: router({
    // Scan URL for threats
    scan: protectedProcedure
      .input(z.object({
        url: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        // Simple threat detection based on patterns
        const suspiciousPatterns = [
          { pattern: "eval(", type: "Suspicious JavaScript", confidence: 87 },
          { pattern: "document.write", type: "DOM Manipulation", confidence: 75 },
          { pattern: "innerHTML", type: "XSS Risk", confidence: 65 },
          { pattern: ".ru/", type: "Suspicious Domain", confidence: 80 },
          { pattern: "bit.ly", type: "URL Shortener", confidence: 60 },
        ];

        const detected = suspiciousPatterns.find(p => input.url.includes(p.pattern));

        if (detected) {
          return {
            threatLevel: "danger" as const,
            threatDetails: {
              type: detected.type,
              description: "Potentially malicious content detected",
              confidence: `${detected.confidence}%`,
            },
          };
        }

        return {
          threatLevel: "safe" as const,
          threatDetails: null,
        };
      }),

    // Start browsing session
    start: protectedProcedure
      .input(z.object({
        url: z.string().url(),
        vpnIp: z.string().optional(),
        vpnLocation: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessionId = randomUUID();
        
        // Scan URL first
        const suspiciousPatterns = [
          { pattern: "eval(", type: "Suspicious JavaScript", confidence: 87 },
          { pattern: "document.write", type: "DOM Manipulation", confidence: 75 },
          { pattern: "innerHTML", type: "XSS Risk", confidence: 65 },
          { pattern: ".ru/", type: "Suspicious Domain", confidence: 80 },
          { pattern: "bit.ly", type: "URL Shortener", confidence: 60 },
        ];

        const detected = suspiciousPatterns.find(p => input.url.includes(p.pattern));
        const threatLevel = detected ? "danger" : "safe";
        const threatDetails = detected ? {
          type: detected.type,
          description: "Potentially malicious content detected",
          confidence: `${detected.confidence}%`,
        } : undefined;

        const session = await createSession({
          id: sessionId,
          userId: ctx.user.id,
          url: input.url,
          vpnIp: input.vpnIp,
          vpnLocation: input.vpnLocation,
          threatLevel: threatLevel as "safe" | "danger",
          threatDetails,
          status: "active",
        });

        // Create threat record if detected
        if (detected) {
          await createThreat({
            id: randomUUID(),
            sessionId,
            threatType: detected.type,
            description: "Potentially malicious content detected",
            confidence: detected.confidence,
          });
        }

        return {
          sessionId,
          threatLevel,
          threatDetails,
        };
      }),

    // Terminate session
    nuke: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .mutation(async ({ input }) => {
        await updateSession(input.sessionId, {
          status: "terminated",
          endedAt: new Date(),
        });

        return { success: true };
      }),

    // Get user's browsing sessions
    sessions: protectedProcedure.query(async ({ ctx }) => {
      const sessions = await getUserSessions(ctx.user.id);
      return sessions;
    }),

    // Get session details
    session: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .query(async ({ input }) => {
        const session = await getSession(input.sessionId);
        if (!session) {
          throw new Error("Session not found");
        }

        const threats = await getSessionThreats(input.sessionId);
        
        return {
          ...session,
          threats,
        };
      }),
  }),

  analytics: router({
    // Get user statistics
    stats: protectedProcedure.query(async ({ ctx }) => {
      const sessions = await getUserSessions(ctx.user.id);
      const threats = await getUserThreats(ctx.user.id);

      const totalSessions = sessions.length;
      const activeSessions = sessions.filter(s => s.status === "active").length;
      const threatsDetected = threats.length;
      const safeSessions = sessions.filter(s => s.threatLevel === "safe").length;

      return {
        totalSessions,
        activeSessions,
        threatsDetected,
        safeSessions,
        dangerousSessions: totalSessions - safeSessions,
      };
    }),

    // Get threat history
    threats: protectedProcedure.query(async ({ ctx }) => {
      const threats = await getUserThreats(ctx.user.id);
      return threats;
    }),
  }),
});

export type AppRouter = typeof appRouter;

