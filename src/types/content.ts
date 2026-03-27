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

export type ContactData = {
  email: string;
  phone: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  copyright: string;
};

export type LandingContent = {
  artistName: string;
  heroTitle: string;
  heroSubtitle: string;
  navItems: NavItem[];
  tracks: MusicTrack[];
  contacts: ContactData;
};

export const defaultLandingContent: LandingContent = {
  artistName: "Live Performance",
  heroTitle: "Live sound. Stage energy.",
  heroSubtitle:
    "Musician for festivals, private events, and club shows. Listen to tracks, browse photos, and book a live performance.",
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
  contacts: {
    email: "artist@email.com",
    phone: "+1 (000) 000-00-00",
    facebook: "",
    instagram: "",
    tiktok: "",
    copyright: "© 2026 Live Performance. All rights reserved.",
  },
};
