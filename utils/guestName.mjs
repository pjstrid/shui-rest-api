const words = [
  "antman",
  "blackpanther",
  "blackwidow",
  "bucky",
  "captainamerica",
  "drax",
  "falcon",
  "gamora",
  "groot",
  "hawkeye",
  "hulk",
  "ironman",
  "korg",
  "loki",
  "mantis",
  "nebula",
  "rocket",
  "spiderman",
  "starlord",
  "thor",
  "vision",
  "warmachine",
];

// A random word + 3 digits, for example ironman123
export const generateGuestName = () => {
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `${word}${digits}`;
};
