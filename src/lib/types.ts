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

export type Partner = {
  name: string;
  /** Present once a claim link has been created on the server. */
  claimToken?: string;
  claimed?: boolean;
};

export type LogSource = 'photo' | 'gpx' | 'manual' | 'claim';

export type SummitLog = {
  id: string;
  peakId: string;
  date: string | null;
  partners: Partner[];
  note: string;
  source: LogSource;
  createdAt: number;
  /** Who tagged you, for logs that came from a claim link. */
  taggedBy?: string;
};

export type Profile = {
  name: string;
  /** Up to four peak ids. */
  favorites: string[];
};
