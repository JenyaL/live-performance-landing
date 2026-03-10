import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { getLandingContent } from "../lib/content";
import logoImage from "../img/2026-03-05 20.30.18.jpg";
import type { LandingContent } from "../types/content";

export function LandingPage() {
  const logoBlendStyle = {
    "--logo-image": `url(${logoImage})`,
  } as CSSProperties;

  const [content, setContent] = useState<LandingContent | null>(null);

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
  const heroImagePosition = content
    ? `${content.heroImagePositionX}% ${content.heroImagePositionY}%`
    : "50% 50%";

  return (
    <div className="site-bg" style={logoBlendStyle}>
      <div className="bg" aria-hidden="true">
        <div className="bg__nebula" />
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
      </main>
    </div>
  );
}
