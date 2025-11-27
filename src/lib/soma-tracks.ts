export interface Track {
  id: number;
  title: string;
  file: string;
}

export const ALBUM_TITLE = "Maps for the Places We Haven't Been Yet";

export const tracks: Track[] = [
  {
    id: 1,
    title: "A) Keep Moving / B) Slow Down First",
    file: "/audio/01_keep-moving_slow-down-first.mp3"
  },
  {
    id: 2,
    title: "How Do I Stop Checking My Phone?",
    file: "/audio/02_how-do-i-stop-checking-my-phone.mp3"
  },
  {
    id: 3,
    title: "A) Keep the Dream / B) Wake Up",
    file: "/audio/03_keep-the-dream_wake-up.mp3"
  },
  {
    id: 4,
    title: "Why Do I Long for a Place I've Never Been?",
    file: "/audio/04_why-do-i-long-for-a-place-ive-never-seen.mp3"
  },
  {
    id: 5,
    title: "A) Hold On / B) Let Go",
    file: "/audio/05_hold-on_let-go.mp3"
  },
  {
    id: 6,
    title: "Is This the Part Where I Change?",
    file: "/audio/06_is-this-the-part-where-i-change.mp3"
  }
];
