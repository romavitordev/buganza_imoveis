import { describe, expect, it } from "vitest";
import { idDoYoutube, urlAssistirYoutube, urlEmbedYoutube } from "@/lib/youtube";

describe("idDoYoutube", () => {
  const id = "dQw4w9WgXcQ";
  it("reconhece as formas comuns de link", () => {
    expect(idDoYoutube(`https://www.youtube.com/watch?v=${id}`)).toBe(id);
    expect(idDoYoutube(`https://youtu.be/${id}`)).toBe(id);
    expect(idDoYoutube(`https://www.youtube.com/shorts/${id}`)).toBe(id);
    expect(idDoYoutube(`https://www.youtube.com/embed/${id}`)).toBe(id);
    expect(idDoYoutube(`https://www.youtube.com/live/${id}`)).toBe(id);
    expect(idDoYoutube(`https://www.youtube.com/watch?list=abc&v=${id}`)).toBe(id);
  });
  it("rejeita o que não é YouTube", () => {
    expect(idDoYoutube("https://vimeo.com/123456")).toBeNull();
    expect(idDoYoutube("https://storage.supabase.co/video.mp4")).toBeNull();
    expect(idDoYoutube("")).toBeNull();
    expect(idDoYoutube(null)).toBeNull();
  });
});

describe("urls", () => {
  it("embed usa nocookie e watch usa a forma canonica", () => {
    expect(urlEmbedYoutube("abc123def45")).toBe(
      "https://www.youtube-nocookie.com/embed/abc123def45?rel=0"
    );
    expect(urlEmbedYoutube("abc123def45", true)).toContain("autoplay=1");
    expect(urlAssistirYoutube("abc123def45")).toBe(
      "https://www.youtube.com/watch?v=abc123def45"
    );
  });
});
