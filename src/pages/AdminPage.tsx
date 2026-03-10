import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { getLandingContent, isAdminUser, saveLandingContent } from "../lib/content";
import { uploadImageToCloudinary } from "../lib/cloudinary";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import { extractYoutubeVideoId } from "../lib/youtube";
import type { LandingContent } from "../types/content";

export function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [content, setContent] = useState<LandingContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDraggingHeroImage, setIsDraggingHeroImage] = useState(false);
  const heroImageEditorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (!user) {
        setContent(null);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setAuthError("");
      try {
        const allowed = await isAdminUser(currentUser.uid);
        if (!allowed) {
          setAuthError("Access denied: your account is not in the admin allowlist.");
          if (auth) {
            await signOut(auth);
          }
          return;
        }

        const nextContent = await getLandingContent();
        setContent(nextContent);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [currentUser]);

  const handleSignIn = async () => {
    if (!auth) {
      setAuthError("Firebase Auth is not configured.");
      return;
    }

    setIsAuthSubmitting(true);
    setAuthError("");

    try {
      await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
    } catch {
      setAuthError("Sign-in failed. Check your email and password.");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const updateHero = (
    key: "artistName" | "heroTitle" | "heroSubtitle" | "heroImageUrl" | "heroImagePositionX" | "heroImagePositionY",
    value: string | number,
  ) => {
    if (!content) return;
    setContent({ ...content, [key]: value });
  };

  const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

  const updateHeroImagePositionByClient = (clientX: number, clientY: number) => {
    if (!content || !heroImageEditorRef.current) return;

    const rect = heroImageEditorRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const nextX = clampPercent(((clientX - rect.left) / rect.width) * 100);
    const nextY = clampPercent(((clientY - rect.top) / rect.height) * 100);

    setContent({
      ...content,
      heroImagePositionX: Number(nextX.toFixed(1)),
      heroImagePositionY: Number(nextY.toFixed(1)),
    });
  };

  const uploadHeroImage = async (file: File) => {
    if (!content) return;

    setStatus("Uploading hero photo to Cloudinary...");
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setContent({
        ...content,
        heroImageUrl: imageUrl,
      });
      setStatus("Hero photo uploaded");
    } catch {
      setStatus("Failed to upload hero photo");
    }
  };

  const updateContact = (key: "email" | "phone" | "copyright", value: string) => {
    if (!content) return;
    setContent({ ...content, contacts: { ...content.contacts, [key]: value } });
  };

  const updateTrack = (trackId: string, key: "title" | "youtubeUrl", value: string) => {
    if (!content) return;

    const updatedTracks = content.tracks.map((track) => {
      if (track.id !== trackId) return track;

      if (key === "youtubeUrl") {
        return {
          ...track,
          youtubeUrl: value,
          videoId: extractYoutubeVideoId(value),
        };
      }

      return { ...track, [key]: value };
    });

    setContent({ ...content, tracks: updatedTracks });
  };

  const addTrack = () => {
    if (!content) return;
    setContent({
      ...content,
      tracks: [
        ...content.tracks,
        {
          id: crypto.randomUUID(),
          title: "New track",
          youtubeUrl: "",
          videoId: "",
        },
      ],
    });
  };

  const removeTrack = (id: string) => {
    if (!content) return;
    setContent({ ...content, tracks: content.tracks.filter((item) => item.id !== id) });
  };

  const removeImage = (id: string) => {
    if (!content) return;
    setContent({ ...content, gallery: content.gallery.filter((item) => item.id !== id) });
  };

  const uploadImage = async (file: File) => {
    if (!content) return;

    setStatus("Uploading photo to Cloudinary...");
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setContent({
        ...content,
        gallery: [
          ...content.gallery,
          {
            id: crypto.randomUUID(),
            title: file.name,
            imageUrl,
          },
        ],
      });
      setStatus("Photo uploaded");
    } catch {
      setStatus("Failed to upload photo");
    }
  };

  const save = async () => {
    if (!content || !currentUser) return;

    setIsSaving(true);
    setStatus("Saving changes...");

    try {
      await saveLandingContent(content, {
        uid: currentUser.uid,
        email: currentUser.email ?? "",
      });
      setStatus("Saved");
    } catch {
      setStatus("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isFirebaseConfigured) {
    return <main className="shell error">Firebase is not configured. Check VITE_FIREBASE_* variables.</main>;
  }

  if (isAuthLoading) return <main className="shell">Checking authentication...</main>;

  if (!currentUser) {
    return (
      <main className="shell admin-auth-page">
        <section className="admin-auth-card">
          <h1>Admin sign in</h1>
          <p>Access is restricted to authenticated Firebase Auth users.</p>

          <label>
            Email
            <input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} type="email" />
          </label>

          <label>
            Password
            <input
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              type="password"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSignIn();
                }
              }}
            />
          </label>

          <button type="button" className="save-btn" onClick={() => void handleSignIn()} disabled={isAuthSubmitting}>
            {isAuthSubmitting ? "Signing in..." : "Sign in"}
          </button>

          {authError && <p className="error">{authError}</p>}
        </section>
      </main>
    );
  }

  if (isLoading) return <main className="shell">Loading admin panel...</main>;
  if (!content) return <main className="shell error">Failed to load data</main>;

  return (
    <main className="shell admin-page">
      <div className="admin-header-row">
        <h1>Admin panel</h1>
        <button type="button" className="ghost" onClick={() => void handleSignOut()}>
          Sign out
        </button>
      </div>
      <p className="admin-note">Changes here update the landing page content.</p>

      <section className="admin-section">
        <h2>Hero</h2>
        <label>
          Artist name
          <input value={content.artistName} onChange={(event) => updateHero("artistName", event.target.value)} />
        </label>
        <label>
          Title
          <input value={content.heroTitle} onChange={(event) => updateHero("heroTitle", event.target.value)} />
        </label>
        <label>
          Subtitle
          <textarea
            value={content.heroSubtitle}
            onChange={(event) => updateHero("heroSubtitle", event.target.value)}
          />
        </label>

        <label className="upload-box">
          Upload hero photo
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) {
                void uploadHeroImage(selected);
              }
            }}
          />
        </label>

        <div className="hero-photo-admin-controls">
          <label>
            Position X: {content.heroImagePositionX.toFixed(1)}%
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={content.heroImagePositionX}
              onChange={(event) => updateHero("heroImagePositionX", Number(event.target.value))}
            />
          </label>

          <label>
            Position Y: {content.heroImagePositionY.toFixed(1)}%
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={content.heroImagePositionY}
              onChange={(event) => updateHero("heroImagePositionY", Number(event.target.value))}
            />
          </label>
        </div>

        <div
          className="hero-photo-editor"
          ref={heroImageEditorRef}
          onPointerDown={(event) => {
            if (!content.heroImageUrl) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            setIsDraggingHeroImage(true);
            updateHeroImagePositionByClient(event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            if (!isDraggingHeroImage) return;
            updateHeroImagePositionByClient(event.clientX, event.clientY);
          }}
          onPointerUp={() => setIsDraggingHeroImage(false)}
          onPointerCancel={() => setIsDraggingHeroImage(false)}
        >
          {content.heroImageUrl ? (
            <img
              src={content.heroImageUrl}
              alt="Hero preview"
              className="hero-photo-editor__image"
              style={{ objectPosition: `${content.heroImagePositionX}% ${content.heroImagePositionY}%` }}
            />
          ) : (
            <div className="hero-photo-editor__empty">Upload a photo for the hero section</div>
          )}
          <div className="hero-photo-editor__hint">Drag the photo to adjust its center point</div>
        </div>
      </section>

      <section className="admin-section">
        <h2>Music</h2>
        <button className="ghost" onClick={addTrack} type="button">
          Add track
        </button>
        {content.tracks.map((track) => (
          <article className="item-row" key={track.id}>
            <label>
              Title
              <input value={track.title} onChange={(event) => updateTrack(track.id, "title", event.target.value)} />
            </label>
            <label>
              YouTube URL
              <input
                value={track.youtubeUrl}
                onChange={(event) => updateTrack(track.id, "youtubeUrl", event.target.value)}
              />
            </label>
            <button type="button" className="danger" onClick={() => removeTrack(track.id)}>
              Delete
            </button>
          </article>
        ))}
      </section>

      <section className="admin-section">
        <h2>Gallery</h2>
        <label className="upload-box">
          Upload photo
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) {
                void uploadImage(selected);
              }
            }}
          />
        </label>
        <div className="gallery-admin-list">
          {content.gallery.map((image) => (
            <article className="item-row" key={image.id}>
              <img src={image.imageUrl} alt={image.title} />
              <input
                value={image.title}
                onChange={(event) => {
                  setContent({
                    ...content,
                    gallery: content.gallery.map((item) =>
                      item.id === image.id ? { ...item, title: event.target.value } : item,
                    ),
                  });
                }}
              />
              <button type="button" className="danger" onClick={() => removeImage(image.id)}>
                Delete
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Contacts</h2>
        <label>
          Email
          <input value={content.contacts.email} onChange={(event) => updateContact("email", event.target.value)} />
        </label>
        <label>
          Phone
          <input value={content.contacts.phone} onChange={(event) => updateContact("phone", event.target.value)} />
        </label>
        <label>
          Copyright
          <input
            value={content.contacts.copyright}
            onChange={(event) => updateContact("copyright", event.target.value)}
          />
        </label>
      </section>

      <div className="admin-actions">
        <button className="save-btn" onClick={() => void save()} disabled={isSaving} type="button">
          {isSaving ? "Saving..." : "Save"}
        </button>
        <span>{status}</span>
      </div>
    </main>
  );
}
