export function extractYoutubeVideoId(url: string): string {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "");
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      const fromSearch = parsedUrl.searchParams.get("v");
      if (fromSearch) return fromSearch;

      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      const embedIndex = segments.findIndex((item) => item === "embed");
      if (embedIndex >= 0 && segments[embedIndex + 1]) {
        return segments[embedIndex + 1];
      }
    }
  } catch {
    return "";
  }

  return "";
}
