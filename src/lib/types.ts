export type Peak = {
  id: string;
  name: string;
  elevationFt: number;
  lat: number;
  lon: number;
  range: string;
  ranked: boolean;
  /** Coordinates not yet verified against a survey source. */
  approx?: boolean;
};

/** Facts about a peak from public sources. */
export type PeakStats = {
  prominenceFt?: number;
  isolationMi?: number;
  firstAscent?: string;
  easiestRoute?: string;
  location?: string;
  wiki?: string;
};

/** A bundled photo of a peak, with the credit its license asks for. */
export type PeakPhoto = { src: number; author: string; license: string; source: string; w: number; h: number };

/** A located moment: a photo, or a GPS track point. */
export type GeoPoint = {
  lat: number;
  lon: number;
  /** Unix ms. Optional for GPX points without time. */
  time?: number;
  /** Where it came from, e.g. a photo asset id. */
  sourceId?: string;
};

export type Confidence = 'high' | 'medium';

/** A summit the detector thinks happened. The user confirms it before it's logged. */
export type SummitCandidate = {
  peakId: string;
  /** Local calendar day, YYYY-MM-DD, or null if the points had no time. */
  date: string | null;
  bestDistanceM: number;
  pointCount: number;
  sourceIds: string[];
  confidence: Confidence;
};

export type LogSource = 'photo' | 'gpx' | 'manual' | 'claim' | 'plan';

/** Someone on the app. `me` is always the signed-in user. */
export type User = {
  id: string;
  name: string;
  handle: string;
  /** Where they usually start from, e.g. "Denver". */
  home: string;
  /** Avatar background, picked once. */
  color: string;
  /** Up to four peak ids. */
  favorites: string[];
  /** So a friend can tag you on a climb before you've joined. Only ever for notifications. */
  email?: string;
  /** Finished the first-run "add the peaks you've done" step. */
  onboarded?: boolean;
  /** Who sees your ascents. Public shows first name and last initial to everyone. */
  privacy?: 'public' | 'friends';
};

/** Conditions report attached to an ascent: the "beta" other people plan around. */
export type Beta = {
  surface?: 'Dry' | 'Patchy snow' | 'Snow' | 'Ice';
  traction?: 'None' | 'Microspikes' | 'Crampons';
  wind?: 'Calm' | 'Breezy' | 'Howling';
  /** Local time on top, "HH:MM". */
  summitTime?: string;
  route?: string;
};

export type Comment = { id: string; userId: string; text: string; at: number };

/** One person standing on one summit on one day. */
export type Ascent = {
  id: string;
  userId: string;
  peakId: string;
  date: string | null;
  /** Other app users who were there. Each of them gets their own ascent too. */
  withIds: string[];
  /** People who aren't on the app yet; each gets a claim link. */
  guests: { name: string; claimToken?: string }[];
  note: string;
  beta?: Beta;
  source: LogSource;
  createdAt: number;
  /** Camera-roll asset id (only on the device that took it). */
  photoId?: string;
  kudos: string[];
  comments: Comment[];
  /** 0.5 to 5 in half steps, like Letterboxd. */
  rating?: number;
  /** Calendar winter, Dec 21 to Mar 20: the usual 14er standard. */
  winter?: boolean;
  /** Photo uris picked when logging. */
  photos?: string[];
  /** From src/data/routes.ts, or 'other' with the climber's own numbers. */
  routeId?: string;
  customMiles?: number;
  customGainFt?: number;
  /** Set when this ascent came from someone else's tag or a group plan. */
  taggedBy?: string;
  planId?: string;
};

/** A climb people are getting together for. Open seats are how strangers become partners. */
export type Plan = {
  id: string;
  peakId: string;
  date: string;
  /** Trailhead start, "HH:MM". */
  start: string;
  hostId: string;
  memberIds: string[];
  /** Asked to join, waiting on the host. */
  requestIds: string[];
  /** Total group size the host wants, host included. */
  size: number;
  visibility: 'crew' | 'public';
  note: string;
  createdAt: number;
  done?: boolean;
};

/** A question about a peak, Nextdoor-style. People who climbed it lately are asked to answer. */
export type Question = {
  id: string;
  peakId: string;
  userId: string;
  text: string;
  at: number;
  answers: { id: string; userId: string; text: string; at: number }[];
};

/** Something that happened that you'd want to hear about. */
export type Notif = {
  id: string;
  kind: 'kudos' | 'comment' | 'follow' | 'answer' | 'question' | 'want-climbed' | 'conditions' | 'badge' | 'legend';
  at: number;
  userId?: string;
  peakId?: string;
  ascentId?: string;
  questionId?: string;
  text?: string;
};
