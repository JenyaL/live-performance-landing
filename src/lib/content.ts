import { collection, doc, getDoc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { defaultLandingContent, type LandingContent } from "../types/content";

const CONTENT_COLLECTION = "landing";
const CONTENT_DOC_ID = "main";
const ADMIN_USERS_COLLECTION = "admin_users";
const ADMIN_LOGS_COLLECTION = "admin_logs";
const FIRESTORE_TIMEOUT_MS = 4000;

type SaveActor = {
  uid: string;
  email: string;
};

function mergeLandingContent(rawData: unknown): LandingContent {
  const raw = (rawData ?? {}) as Partial<LandingContent>;

  return {
    ...defaultLandingContent,
    ...raw,
    contacts: {
      ...defaultLandingContent.contacts,
      ...(raw.contacts ?? {}),
    },
    navItems: Array.isArray(raw.navItems) ? raw.navItems : defaultLandingContent.navItems,
    tracks: Array.isArray(raw.tracks) ? raw.tracks : defaultLandingContent.tracks,
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Firestore request timeout"));
      }, timeoutMs);
    }),
  ]);
}

export async function getLandingContent(): Promise<LandingContent> {
  if (!db) {
    return defaultLandingContent;
  }

  const contentRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
  try {
    const snapshot = await withTimeout(getDoc(contentRef), FIRESTORE_TIMEOUT_MS);

    if (!snapshot.exists()) {
      await withTimeout(setDoc(contentRef, defaultLandingContent), FIRESTORE_TIMEOUT_MS);
      return defaultLandingContent;
    }

    return mergeLandingContent(snapshot.data());
  } catch {
    return defaultLandingContent;
  }
}

export async function isAdminUser(uid: string): Promise<boolean> {
  if (!db || !uid) return false;

  const adminRef = doc(db, ADMIN_USERS_COLLECTION, uid);
  try {
    const snapshot = await withTimeout(getDoc(adminRef), FIRESTORE_TIMEOUT_MS);
    return snapshot.exists();
  } catch {
    return false;
  }
}

export async function saveLandingContent(content: LandingContent, actor: SaveActor): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not configured");
  }

  const contentRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
  const logsRef = collection(db, ADMIN_LOGS_COLLECTION);

  const auditPayload = {
    actorUid: actor.uid,
    actorEmail: actor.email || "unknown",
    action: "save_landing_content",
    targetPath: `${CONTENT_COLLECTION}/${CONTENT_DOC_ID}`,
    savedSummary: {
      artistName: content.artistName,
      heroTitle: content.heroTitle,
      heroSubtitle: content.heroSubtitle,
      tracksCount: content.tracks.length,
      contacts: content.contacts,
    },
    createdAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(contentRef, content);
  batch.set(doc(logsRef), auditPayload);

  await withTimeout(batch.commit(), FIRESTORE_TIMEOUT_MS);
}
