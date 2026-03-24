import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getLandingContent } from "../lib/content";
import logoImage from "../img/logo_singer.svg";
import { extractYoutubeVideoId } from "../lib/youtube";
import type { LandingContent } from "../types/content";

type PlayerState = "stopped" | "playing" | "paused";

export function LandingPage() {
  const logoBlendStyle = {
    "--logo-image": `url(${logoImage})`,
  } as CSSProperties;

  const [content, setContent] = useState<LandingContent | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [playerState, setPlayerState] = useState<PlayerState>("stopped");
  const [embedNonce, setEmbedNonce] = useState(0);

  useEffect(() => {
    const load = async () => {
      const nextContent = await getLandingContent();
      setContent(nextContent);
    };

    void load();
  }, []);

  const heroTitle = content?.heroTitle ?? "Live sound. Stage energy.";
  const artistName = content?.artistName ?? "Live Performance";
  const heroSubtitle = content?.heroSubtitle ?? "";
  const heroImageUrl = content?.heroImageUrl ?? "";
  const contactEmail = content?.contacts.email ?? "artist@email.com";
  const contactPhone = content?.contacts.phone ?? "+1 (000) 000-00-00";
  const contactCopyright = content?.contacts.copyright ?? "";
  const phoneHref = `tel:${contactPhone.replace(/[^\d+]/g, "")}`;
  const heroImagePosition = content
    ? `${content.heroImagePositionX}% ${content.heroImagePositionY}%`
    : "50% 50%";

  const navLinks = useMemo(() => {
    const allowedHrefs = new Set(["#hero", "#music", "#contacts"]);
    const source = content?.navItems ?? [
      { id: "hero", label: "Home", href: "#hero" },
      { id: "music", label: "Music", href: "#music" },
      { id: "contacts", label: "Contacts", href: "#contacts" },
    ];

    const filtered = source.filter((item) => allowedHrefs.has(item.href));
    return filtered.length
      ? filtered
      : [
          { id: "hero", label: "Home", href: "#hero" },
          { id: "music", label: "Music", href: "#music" },
          { id: "contacts", label: "Contacts", href: "#contacts" },
        ];
  }, [content?.navItems]);

  const tracks = useMemo(() => {
    return (content?.tracks ?? [])
      .map((track) => ({
        ...track,
        resolvedVideoId: track.videoId || extractYoutubeVideoId(track.youtubeUrl),
      }))
      .filter((track) => track.resolvedVideoId);
  }, [content?.tracks]);

  useEffect(() => {
    if (!tracks.length) {
      setSelectedTrackId("");
      setPlayerState("stopped");
      return;
    }

    const selectedExists = tracks.some((track) => track.id === selectedTrackId);
    if (!selectedExists) {
      setSelectedTrackId(tracks[0].id);
      setPlayerState("stopped");
    }
  }, [selectedTrackId, tracks]);

  const activeTrack = tracks.find((track) => track.id === selectedTrackId) ?? tracks[0] ?? null;

  const sendPlayerCommand = (command: "playVideo" | "pauseVideo" | "stopVideo") => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: command,
        args: [],
      }),
      "*",
    );
  };

  const handleTrackButton = (trackId: string) => {
    const isActiveTrack = activeTrack?.id === trackId;

    if (!isActiveTrack) {
      setSelectedTrackId(trackId);
      setPlayerState("playing");
      setEmbedNonce((prev) => prev + 1);
      return;
    }

    if (playerState === "stopped") {
      sendPlayerCommand("playVideo");
      setPlayerState("playing");
      return;
    }

    if (playerState === "playing") {
      sendPlayerCommand("pauseVideo");
      setPlayerState("paused");
      return;
    }

    sendPlayerCommand("stopVideo");
    setPlayerState("stopped");
  };

  const buildEmbedUrl = (videoId: string, shouldAutoplay: boolean): string => {
    const params = new URLSearchParams({
      autoplay: shouldAutoplay ? "1" : "0",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      enablejsapi: "1",
      origin: window.location.origin,
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  return (
    <div className="site-bg" style={logoBlendStyle}>
      <div className="bg" aria-hidden="true">
        <div className="bg__nebula">
          <div className="star-flare-layer" />
        </div>
        <div className="bg__logo-merge" />
        <div className="bg__vignette" />
        <div className="bg__frame" />
        <div className="bg__ornaments" />
      </div>

      <svg className="bg-filter" aria-hidden="true" focusable="false">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>

      <header className="landing-header-strip">
        <img className="landing-logo-visible" src={logoImage} alt="Logo" />
        <nav className="landing-nav" aria-label="Landing sections">
          <div className="landing-nav__links">
            {navLinks.map((item) => (
              <a key={item.id} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <main className="shell landing-page">
        <section id="hero" className="landing-block landing-hero">
          <div className="landing-hero__layout">
            <h1 className="landing-hero__title">{heroTitle}</h1>

            <div className="landing-hero__content">
              <p className="landing-hero__artist">{artistName}</p>
              <p className="landing-hero__subtitle">{heroSubtitle}</p>

              <div className="landing-hero__actions">
                <a href="#music">Listen to tracks</a>
              </div>
            </div>

            <aside className="landing-hero__photo-slot" aria-label="Photo in hero section">
              {heroImageUrl ? (
                <img src={heroImageUrl} alt="Hero" className="landing-hero__photo" style={{ objectPosition: heroImagePosition }} />
              ) : (
                <div className="landing-hero__photo-placeholder">Hero photo will appear here from admin</div>
              )}
            </aside>
          </div>
        </section>

        <section id="music" className="landing-block music-gallery">
          <h2>Music Gallery</h2>

          {!tracks.length ? (
            <p className="landing-empty">Tracks will appear here after you add them in admin panel.</p>
          ) : (
            <div className="music-gallery__layout">
              <div className="music-gallery__preview">
                {activeTrack ? (
                  <iframe
                    ref={iframeRef}
                    key={`${activeTrack.id}-${embedNonce}`}
                    title={activeTrack.title || "Track preview"}
                    src={buildEmbedUrl(activeTrack.resolvedVideoId, playerState === "playing")}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <p className="landing-empty">Select a track to preview</p>
                )}
              </div>

              <div className="music-gallery__list" role="list" aria-label="Tracks list">
                {tracks.map((track) => {
                  const isCurrent = activeTrack?.id === track.id;
                  const buttonLabel = !isCurrent
                    ? "Play"
                    : playerState === "playing"
                      ? "Pause"
                      : playerState === "paused"
                        ? "Stop"
                        : "Play";
                  const iconState = buttonLabel.toLowerCase();

                  return (
                    <article className={`music-track-item ${isCurrent ? "is-active" : ""}`} key={track.id} role="listitem">
                      <button
                        type="button"
                        className="music-track-item__control"
                        onClick={() => handleTrackButton(track.id)}
                        aria-label={`${buttonLabel} ${track.title}`}
                        title={buttonLabel}
                      >
                        <span className={`music-track-item__icon is-${iconState}`} aria-hidden="true" />
                      </button>
                      <p className="music-track-item__title">{track.title || "Untitled track"}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section id="contacts" className="landing-block landing-contacts">
          <h2>Contacts</h2>
          <div className="landing-contact-list">
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            <a href={phoneHref}>{contactPhone}</a>
          </div>
        </section>

        <footer className="landing-footer">{contactCopyright}</footer>
      </main>
    </div>
  );
}
