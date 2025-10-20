import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, vpnLocations, sessions, threats, 
  userSettings, InsertUserSettings, chatMessages, InsertChatMessage,
  payments, InsertPayment
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserSettings(userId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserSettings(settings: InsertUserSettings) {
  const db = await getDb();
  if (!db) return;

  await db.insert(userSettings).values(settings).onDuplicateKeyUpdate({
    set: settings,
  });
}

export async function getAllVpnLocations() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(vpnLocations);
}

export async function getVpnLocationById(id: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(vpnLocations).where(eq(vpnLocations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserSessions(userId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(sessions).where(eq(sessions.userId, userId));
}

export async function getSessionById(id: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSession(id: string, data: Partial<typeof sessions.$inferInsert>) {
  const db = await getDb();
  if (!db) return;

  await db.update(sessions).set(data).where(eq(sessions.id, id));
}

export async function deleteSession(id: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(sessions).set({
    status: "deleted",
    deletedAt: new Date(),
  }).where(eq(sessions.id, id));
}

export async function getChatMessages(sessionId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId));
}

export async function insertChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) return;

  await db.insert(chatMessages).values(message);
}

export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) return;

  await db.insert(payments).values(payment);
}

export async function updatePayment(id: string, data: Partial<typeof payments.$inferInsert>) {
  const db = await getDb();
  if (!db) return;

  await db.update(payments).set(data).where(eq(payments.id, id));
}

export async function updateUserSubscription(userId: string, tier: "free" | "pro", expiryDate?: Date) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({
    subscriptionTier: tier,
    subscriptionExpiry: expiryDate,
  }).where(eq(users.id, userId));
}

