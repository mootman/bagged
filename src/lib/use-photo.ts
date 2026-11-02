import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { photoUri } from './scan-photos';

const cache = new Map<string, string | null>();

/** Resolve a camera-roll asset id to a displayable uri. Null on web or if the photo is gone. */
export function usePhoto(assetId: string | undefined) {
  const [loaded, setLoaded] = useState<{ id: string; uri: string | null } | null>(null);

  useEffect(() => {
    if (!assetId || Platform.OS === 'web' || cache.has(assetId)) return;
    let live = true;
    photoUri(assetId).then((uri) => {
      cache.set(assetId, uri);
      if (live) setLoaded({ id: assetId, uri });
    });
    return () => {
      live = false;
    };
  }, [assetId]);

  if (!assetId) return null;
  if (cache.has(assetId)) return cache.get(assetId) ?? null;
  return loaded?.id === assetId ? loaded.uri : null;
}
