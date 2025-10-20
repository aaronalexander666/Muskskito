import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, sessions, threats, vpnLocations, InsertSession, InsertThreat, InsertVpnLocation } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

// VPN Location helpers
export async function getVpnLocations() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(vpnLocations);
}

export async function createVpnLocation(location: InsertVpnLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(vpnLocations).values(location);
}

// Session helpers
export async function createSession(session: InsertSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(sessions).values(session);
  return session;
}

export async function getUserSessions(userId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.startedAt));
}

export async function getSession(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSession(id: string, updates: Partial<InsertSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(sessions).set(updates).where(eq(sessions.id, id));
}

// Threat helpers
export async function createThreat(threat: InsertThreat) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(threats).values(threat);
}

export async function getSessionThreats(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(threats)
    .where(eq(threats.sessionId, sessionId))
    .orderBy(desc(threats.detectedAt));
}

export async function getUserThreats(userId: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Join sessions and threats to get user's threats
  const userSessions = await getUserSessions(userId);
  const sessionIds = userSessions.map(s => s.id);
  
  if (sessionIds.length === 0) return [];
  
  const allThreats = await Promise.all(
    sessionIds.map(id => getSessionThreats(id))
  );
  
  return allThreats.flat();
}

