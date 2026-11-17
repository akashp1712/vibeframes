import { describe, expect, it } from "vitest";
import { DEMO_FILM, FilmSchema, ImageSchema, makeStory, timeline, filmDuration } from "./schema";
describe("feature-film contract", () => {
  it("keeps scenes contiguous and ends exactly on the composition boundary", () => {
    const film = FilmSchema.parse(DEMO_FILM);
    const clips = timeline(film.story);
    expect(filmDuration(film)).toBe(630);
    clips.slice(1).forEach((c, i) => expect(c.from).toBe(clips[i].from + clips[i].duration));
    expect(clips.at(-1)!.from + clips.at(-1)!.duration).toBe(630);
  });
  it("rejects executable, remote, and oversized screenshot inputs", () => {
    for (const value of [
      "https://localhost/a.png",
      "data:image/svg+xml;base64,abcd",
      "file:///etc/passwd",
    ])
      expect(ImageSchema.safeParse(value).success).toBe(false);
    expect(ImageSchema.safeParse("data:image/png;base64,aGVsbG8=").success).toBe(true);
  });
  it("rejects excessive scene duration and invalid variants", () => {
    expect(FilmSchema.safeParse({ ...DEMO_FILM, hook: 3 }).success).toBe(false);
    const story = makeStory(DEMO_FILM.brief);
    story.scenes[0].duration = 99999;
    expect(FilmSchema.safeParse({ ...DEMO_FILM, story }).success).toBe(false);
  });
  it("keeps authored claims verbatim in deterministic mode", () => {
    const story = makeStory(DEMO_FILM.brief);
    expect(story.scenes[1].headline).toBe(DEMO_FILM.brief.feature);
    expect(story.scenes[1].body).toBe(DEMO_FILM.brief.after);
    expect(JSON.stringify(story)).not.toMatch(/10x|guaranteed|customers love/);
  });
});
