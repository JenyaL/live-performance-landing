import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { defaultLandingContent, type LandingContent } from "../types/content";

const CONTENT_COLLECTION = "landing";
const CONTENT_DOC_ID = "main";
const FIRESTORE_TIMEOUT_MS = 4000;

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
    gallery: Array.isArray(raw.gallery) ? raw.gallery : defaultLandingContent.gallery,
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

export async function saveLandingContent(content: LandingContent): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not configured");
  }

  const contentRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
  await withTimeout(setDoc(contentRef, content), FIRESTORE_TIMEOUT_MS);
}
