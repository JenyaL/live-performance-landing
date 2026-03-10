import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { getLandingContent, saveLandingContent } from "../lib/content";
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
      try {
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
      setAuthError("Firebase Auth не настроен.");
      return;
    }

    setIsAuthSubmitting(true);
    setAuthError("");

    try {
      await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
    } catch {
      setAuthError("Не удалось войти. Проверьте email и пароль.");
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

    setStatus("Загружаем hero-фото в Cloudinary...");
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setContent({
        ...content,
        heroImageUrl: imageUrl,
      });
      setStatus("Hero-фото добавлено");
    } catch {
      setStatus("Ошибка загрузки hero-фото");
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
          title: "Новый трек",
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

    setStatus("Загружаем фото в Cloudinary...");
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
      setStatus("Фото добавлено");
    } catch {
      setStatus("Ошибка загрузки фото");
    }
  };

  const save = async () => {
    if (!content) return;

    setIsSaving(true);
    setStatus("Сохраняем изменения...");

    try {
      await saveLandingContent(content);
      setStatus("Сохранено");
    } catch {
      setStatus("Ошибка сохранения");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isFirebaseConfigured) {
    return <main className="shell error">Firebase не настроен. Проверьте VITE_FIREBASE_* переменные.</main>;
  }

  if (isAuthLoading) return <main className="shell">Проверяем авторизацию...</main>;

  if (!currentUser) {
    return (
      <main className="shell admin-auth-page">
        <section className="admin-auth-card">
          <h1>Вход в админку</h1>
          <p>Доступ только для авторизованного пользователя Firebase Auth.</p>

          <label>
            Email
            <input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} type="email" />
          </label>

          <label>
            Пароль
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
            {isAuthSubmitting ? "Входим..." : "Войти"}
          </button>

          {authError && <p className="error">{authError}</p>}
        </section>
      </main>
    );
  }

  if (isLoading) return <main className="shell">Загрузка админки...</main>;
  if (!content) return <main className="shell error">Не удалось загрузить данные</main>;

  return (
    <main className="shell admin-page">
      <div className="admin-header-row">
        <h1>Админка</h1>
        <button type="button" className="ghost" onClick={() => void handleSignOut()}>
          Выйти
        </button>
      </div>
      <p className="admin-note">Изменения влияют на контент лендинга.</p>

      <section className="admin-section">
        <h2>Hero</h2>
        <label>
          Имя артиста
          <input value={content.artistName} onChange={(event) => updateHero("artistName", event.target.value)} />
        </label>
        <label>
          Заголовок
          <input value={content.heroTitle} onChange={(event) => updateHero("heroTitle", event.target.value)} />
        </label>
        <label>
          Подзаголовок
          <textarea
            value={content.heroSubtitle}
            onChange={(event) => updateHero("heroSubtitle", event.target.value)}
          />
        </label>

        <label className="upload-box">
          Загрузить фото для Hero
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
            Позиция X: {content.heroImagePositionX.toFixed(1)}%
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
            Позиция Y: {content.heroImagePositionY.toFixed(1)}%
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
            <div className="hero-photo-editor__empty">Загрузите фото для hero-блока</div>
          )}
          <div className="hero-photo-editor__hint">Перетащите фото мышкой, чтобы изменить центровку</div>
        </div>
      </section>

      <section className="admin-section">
        <h2>Музыка</h2>
        <button className="ghost" onClick={addTrack} type="button">
          Добавить трек
        </button>
        {content.tracks.map((track) => (
          <article className="item-row" key={track.id}>
            <label>
              Название
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
              Удалить
            </button>
          </article>
        ))}
      </section>

      <section className="admin-section">
        <h2>Галерея</h2>
        <label className="upload-box">
          Загрузить фото
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
                Удалить
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Контакты</h2>
        <label>
          Email
          <input value={content.contacts.email} onChange={(event) => updateContact("email", event.target.value)} />
        </label>
        <label>
          Телефон
          <input value={content.contacts.phone} onChange={(event) => updateContact("phone", event.target.value)} />
        </label>
        <label>
          Копирайт
          <input
            value={content.contacts.copyright}
            onChange={(event) => updateContact("copyright", event.target.value)}
          />
        </label>
      </section>

      <div className="admin-actions">
        <button className="save-btn" onClick={() => void save()} disabled={isSaving} type="button">
          {isSaving ? "Сохраняем..." : "Сохранить"}
        </button>
        <span>{status}</span>
      </div>
    </main>
  );
}
