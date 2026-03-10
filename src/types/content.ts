export type NavItem = {
  id: string;
  label: string;
  href: string;
};

export type MusicTrack = {
  id: string;
  title: string;
  youtubeUrl: string;
  videoId: string;
};

export type GalleryImage = {
  id: string;
  title: string;
  imageUrl: string;
};

export type ContactData = {
  email: string;
  phone: string;
  copyright: string;
};

export type LandingContent = {
  artistName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroImagePositionX: number;
  heroImagePositionY: number;
  navItems: NavItem[];
  tracks: MusicTrack[];
  gallery: GalleryImage[];
  contacts: ContactData;
};

export const defaultLandingContent: LandingContent = {
  artistName: "Live Performance",
  heroTitle: "Live sound. Stage energy.",
  heroSubtitle:
    "Musician for festivals, private events, and club shows. Listen to tracks, browse photos, and book a live performance.",
  heroImageUrl: "",
  heroImagePositionX: 50,
  heroImagePositionY: 50,
  navItems: [
    { id: crypto.randomUUID(), label: "Home", href: "#hero" },
    { id: crypto.randomUUID(), label: "Music", href: "#music" },
    { id: crypto.randomUUID(), label: "Gallery", href: "#gallery" },
    { id: crypto.randomUUID(), label: "Contacts", href: "#contacts" },
  ],
  tracks: [
    {
      id: crypto.randomUUID(),
      title: "Live Session #1",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      videoId: "dQw4w9WgXcQ",
    },
  ],
  gallery: [],
  contacts: {
    email: "artist@email.com",
    phone: "+1 (000) 000-00-00",
    copyright: "© 2026 Live Performance. All rights reserved.",
  },
};
