import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getAllVpnLocations, 
  getUserSessions, 
  getSessionById, 
  updateSession,
  getUser,
  getUserSettings,
  upsertUserSettings,
  deleteSession,
  getChatMessages,
  insertChatMessage,
  createPayment,
  updatePayment,
  updateUserSubscription,
  getDb
} from "./db";
import { sessions, threats, InsertChatMessage } from "../drizzle/schema";
import { randomUUID } from "crypto";
import { invokeLLM } from "./_core/llm";
import { eq, and, desc } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(async (opts) => {
      if (!opts.ctx.user) return null;
      
      // Get user with subscription info
      const user = await getUser(opts.ctx.user.id);
      return user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      let settings = await getUserSettings(ctx.user.id);
      
      // Create default settings if not exists
      if (!settings) {
        const defaultSettings = {
          id: randomUUID(),
          userId: ctx.user.id,
          autoDeleteSessions: true,
          deleteAfterMinutes: 30,
          blockTrackers: true,
          blockAds: true,
          blockMalware: true,
          enableAiAssistant: true,
          preferredVpnCountry: null,
          threatSensitivity: "medium" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await upsertUserSettings(defaultSettings);
        settings = defaultSettings;
      }
      
      return settings;
    }),

    update: protectedProcedure
      .input(z.object({
        autoDeleteSessions: z.boolean().optional(),
        deleteAfterMinutes: z.number().optional(),
        blockTrackers: z.boolean().optional(),
        blockAds: z.boolean().optional(),
        blockMalware: z.boolean().optional(),
        enableAiAssistant: z.boolean().optional(),
        preferredVpnCountry: z.string().optional(),
        threatSensitivity: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getUserSettings(ctx.user.id);
        
        await upsertUserSettings({
          id: existing?.id || randomUUID(),
          userId: ctx.user.id,
          ...existing,
          ...input,
        });

        return { success: true };
      }),
  }),

  vpn: router({
    locations: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUser(ctx.user.id);
      const isPro = user?.subscriptionTier === "pro";
      
      const locations = await getAllVpnLocations();
      
      // Filter pro locations for free users
      return isPro ? locations : locations.filter(l => !l.isPro);
    }),

    connect: protectedProcedure
      .input(z.object({
        locationId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUser(ctx.user.id);
        const isPro = user?.subscriptionTier === "pro";
        
        const locations = await getAllVpnLocations();
        const availableLocations = isPro ? locations : locations.filter(l => !l.isPro);
        
        let selectedLocation;
        if (input.locationId) {
          selectedLocation = availableLocations.find(l => l.id === input.locationId);
        }
        
        if (!selectedLocation && availableLocations.length > 0) {
          selectedLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
        }

        if (!selectedLocation) {
          throw new Error("No VPN locations available");
        }

        const ipPool = selectedLocation.ipPool as string[];
        const randomIp = ipPool[Math.floor(Math.random() * ipPool.length)];
        const latency = Math.floor(Math.random() * (selectedLocation.latencyMax - selectedLocation.latencyMin)) + selectedLocation.latencyMin;

        return {
          ip: randomIp,
          city: selectedLocation.city,
          country: selectedLocation.country,
          countryCode: selectedLocation.countryCode,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latency: `${latency}ms`,
          locationId: selectedLocation.id,
        };
      }),
  }),

  browse: router({
    scan: protectedProcedure
      .input(z.object({
        url: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        // Simulate AI threat analysis
        const isSuspicious = input.url.includes("malware") || 
                            input.url.includes("phishing") || 
                            input.url.includes("virus");

        const threatLevel = isSuspicious ? "danger" : "safe";
        const threatDetails = isSuspicious ? {
          type: "Potential Malware Detected",
          description: "This URL contains suspicious patterns commonly associated with malware distribution.",
          confidence: "87%",
        } : undefined;

        return {
          threatLevel,
          threatDetails,
        };
      }),

    start: protectedProcedure
      .input(z.object({
        url: z.string().url(),
        vpnIp: z.string().optional(),
        vpnLocation: z.string().optional(),
        vpnCountry: z.string().optional(),
        vpnLatitude: z.string().optional(),
        vpnLongitude: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const settings = await getUserSettings(ctx.user.id);
        
        // Scan URL for threats
        const isSuspicious = input.url.includes("malware") || 
                            input.url.includes("phishing") || 
                            input.url.includes("virus");

        const threatLevel = isSuspicious ? "danger" : "safe";
        const threatDetails = isSuspicious ? {
          type: "Potential Malware Detected",
          description: "This URL contains suspicious patterns commonly associated with malware distribution.",
          confidence: "87%",
        } : undefined;

        const sessionId = randomUUID();
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Calculate auto-delete time
        const autoDeleteAt = settings?.autoDeleteSessions 
          ? new Date(Date.now() + (settings.deleteAfterMinutes * 60 * 1000))
          : undefined;

        await db.insert(sessions).values({
          id: sessionId,
          userId: ctx.user.id,
          url: input.url,
          vpnIp: input.vpnIp,
          vpnLocation: input.vpnLocation,
          vpnCountry: input.vpnCountry,
          vpnLatitude: input.vpnLatitude,
          vpnLongitude: input.vpnLongitude,
          threatLevel: threatLevel as "safe" | "warning" | "danger",
          threatDetails,
          status: "active",
          autoDeleteAt,
        });

        // Log threat if detected
        if (isSuspicious && threatDetails) {
          await db.insert(threats).values({
            id: randomUUID(),
            sessionId,
            threatType: threatDetails.type,
            description: threatDetails.description,
            confidence: 87,
            blocked: true,
          });
        }

        return {
          sessionId,
          threatLevel,
          threatDetails,
        };
      }),

    nuke: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const session = await getSessionById(input.sessionId);
        
        if (!session || session.userId !== ctx.user.id) {
          throw new Error("Session not found or unauthorized");
        }

        await deleteSession(input.sessionId);

        return { success: true };
      }),

    sessions: protectedProcedure.query(async ({ ctx }) => {
      const allSessions = await getUserSessions(ctx.user.id);
      
      // Sort by most recent first
      return allSessions.sort((a, b) => {
        const aTime = a.startedAt?.getTime() || 0;
        const bTime = b.startedAt?.getTime() || 0;
        return bTime - aTime;
      });
    }),
  }),

  chat: router({
    messages: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const session = await getSessionById(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new Error("Session not found or unauthorized");
        }

        return await getChatMessages(input.sessionId);
      }),

    send: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        message: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const session = await getSessionById(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new Error("Session not found or unauthorized");
        }

        // Save user message
        const userMessageId = randomUUID();
        await insertChatMessage({
          id: userMessageId,
          sessionId: input.sessionId,
          userId: ctx.user.id,
          role: "user",
          content: input.message,
        });

        // Get conversation history
        const history = await getChatMessages(input.sessionId);

        // Call LLM for AI response
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a cybersecurity AI assistant helping users browse safely. Provide concise, helpful advice about web security, privacy, and safe browsing practices. Current browsing URL: " + session.url,
            },
            ...history.slice(-10).map(msg => ({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            })),
          ],
        });

        const aiResponseContent = response.choices[0]?.message?.content;
        const aiResponse = typeof aiResponseContent === 'string' ? aiResponseContent : "I'm here to help you browse safely.";

        // Save AI response
        const aiMessageId = randomUUID();
        await insertChatMessage({
          id: aiMessageId,
          sessionId: input.sessionId,
          userId: ctx.user.id,
          role: "assistant",
          content: aiResponse,
        });

        return {
          userMessage: input.message,
          aiResponse,
        };
      }),
  }),

  analytics: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const allSessions = await getUserSessions(ctx.user.id);
      const db = await getDb();
      
      let threatsDetected = 0;
      if (db) {
        const threatsList = await db.select().from(threats);
        threatsDetected = threatsList.length;
      }

      return {
        totalSessions: allSessions.length,
        activeSessions: allSessions.filter(s => s.status === "active").length,
        safeSessions: allSessions.filter(s => s.threatLevel === "safe").length,
        dangerousSessions: allSessions.filter(s => s.threatLevel === "danger" || s.threatLevel === "warning").length,
        threatsDetected,
      };
    }),
  }),

  subscription: router({
    createPayment: protectedProcedure
      .input(z.object({
        tier: z.enum(["pro"]),
        months: z.number().min(1).max(12),
      }))
      .mutation(async ({ input, ctx }) => {
        const amount = input.months * 999; // $9.99 per month in cents
        const paymentId = randomUUID();

        await createPayment({
          id: paymentId,
          userId: ctx.user.id,
          amount,
          currency: "USD",
          status: "pending",
          subscriptionTier: input.tier,
          subscriptionMonths: input.months,
        });

        return {
          paymentId,
          amount,
          currency: "USD",
        };
      }),

    confirmPayment: protectedProcedure
      .input(z.object({
        paymentId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // In production, this would verify payment with payment provider
        // For now, we'll simulate successful payment
        
        await updatePayment(input.paymentId, {
          status: "completed",
          completedAt: new Date(),
        });

        // Update user subscription
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1); // Add 1 month

        await updateUserSubscription(ctx.user.id, "pro", expiryDate);

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

