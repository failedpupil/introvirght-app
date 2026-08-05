import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { FeelId } from '../data/content';
import { ApiError, EchoItem, feltEchoRequest, fetchEchoes, fetchStats, postEchoRequest, signOutRequest } from './api';
import { AuthedSession } from './authClient';

const SESSION_KEY = 'introvirght.echoSession.v1';
const STATS_KEY = 'introvirght.echoStats.v1';
const STATS_TTL_MS = 60 * 60 * 1000;

export interface PendingPost {
  localId: string;
  feel: FeelId;
  text: string;
  createdAtMs: number;
  status: 'sending' | 'failed';
}

interface EchoesContextShape {
  ready: boolean;
  signedIn: boolean;
  feed: EchoItem[];
  pendingPosts: PendingPost[];
  queuedCount: number;
  fetching: boolean;
  statsCount: number | null;

  initialLoad: (feeling?: FeelId) => Promise<void>;
  checkForNew: (feeling?: FeelId) => Promise<void>;
  applyQueued: () => void;
  post: (feel: FeelId, text: string) => void;
  retryPost: (localId: string) => void;
  feltThis: (id: string) => void;
  refreshStats: () => Promise<void>;

  completeGoogleSignIn: (session: AuthedSession) => Promise<void>;
  signOut: () => Promise<void>;
}

const EchoesContext = createContext<EchoesContextShape | null>(null);

export function EchoesProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const [feed, setFeed] = useState<EchoItem[]>([]);
  const [queuedItems, setQueuedItems] = useState<EchoItem[]>([]);
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [fetching, setFetching] = useState(false);
  const [statsCount, setStatsCount] = useState<number | null>(null);

  const feedRef = useRef(feed);
  feedRef.current = feed;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const queuedItemsRef = useRef(queuedItems);
  queuedItemsRef.current = queuedItems;

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(SESSION_KEY);
        setSession(token);
      } catch {
        // treat as signed-out rather than leaving `ready` stuck
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const initialLoad = useCallback(async (feeling?: FeelId) => {
    setFetching(true);
    try {
      const { items } = await fetchEchoes({ feeling }, sessionRef.current);
      setFeed(items);
      setQueuedItems([]);
    } finally {
      setFetching(false);
    }
  }, []);

  const checkForNew = useCallback(async (feeling?: FeelId) => {
    const since = feedRef.current[0]?.createdAtMs;
    if (!since) return initialLoad(feeling);
    setFetching(true);
    try {
      const { items } = await fetchEchoes({ feeling, since }, sessionRef.current);
      if (items.length === 0) return;
      const knownIds = new Set([...feedRef.current.map((e) => e.id), ...queuedItemsRef.current.map((e) => e.id)]);
      const fresh = items.filter((i) => !knownIds.has(i.id));
      if (fresh.length > 0) setQueuedItems((prev) => [...fresh.reverse(), ...prev]);
    } finally {
      setFetching(false);
    }
  }, [initialLoad]);

  const applyQueued = useCallback(() => {
    setFeed((prev) => [...queuedItems, ...prev]);
    setQueuedItems([]);
  }, [queuedItems]);

  const post = useCallback((feel: FeelId, text: string) => {
    const token = sessionRef.current;
    if (!token) return;
    const localId = `local_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    setPendingPosts((prev) => [{ localId, feel, text, createdAtMs: Date.now(), status: 'sending' }, ...prev]);

    postEchoRequest(feel, text, token)
      .then((confirmed) => {
        setPendingPosts((prev) => prev.filter((p) => p.localId !== localId));
        setFeed((prev) => [confirmed, ...prev]);
      })
      .catch(() => {
        setPendingPosts((prev) => prev.map((p) => (p.localId === localId ? { ...p, status: 'failed' } : p)));
      });
  }, []);

  const retryPost = useCallback((localId: string) => {
    const token = sessionRef.current;
    if (!token) return;
    const item = pendingPosts.find((p) => p.localId === localId);
    if (!item) return;
    setPendingPosts((prev) => prev.map((p) => (p.localId === localId ? { ...p, status: 'sending' } : p)));
    postEchoRequest(item.feel, item.text, token)
      .then((confirmed) => {
        setPendingPosts((prev) => prev.filter((p) => p.localId !== localId));
        setFeed((prev) => [confirmed, ...prev]);
      })
      .catch(() => {
        setPendingPosts((prev) => prev.map((p) => (p.localId === localId ? { ...p, status: 'failed' } : p)));
      });
  }, [pendingPosts]);

  const feltThis = useCallback((id: string) => {
    const token = sessionRef.current;
    if (!token) return;
    const target = feedRef.current.find((e) => e.id === id);
    if (!target || target.feltByMe) return;
    setFeed((prev) => prev.map((e) => (e.id === id ? { ...e, felt: e.felt + 1, feltByMe: true } : e)));
    feltEchoRequest(id, token).catch(() => {
      setFeed((prev) => prev.map((e) => (e.id === id ? { ...e, felt: Math.max(0, e.felt - 1), feltByMe: false } : e)));
    });
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const cached = await SecureStore.getItemAsync(STATS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { count: number; fetchedAtMs: number };
        if (Date.now() - parsed.fetchedAtMs < STATS_TTL_MS) {
          setStatsCount(parsed.count);
          return;
        }
      }
    } catch {
      // fall through to a fresh fetch
    }
    try {
      const { peopleTotal } = await fetchStats();
      setStatsCount(peopleTotal);
      await SecureStore.setItemAsync(STATS_KEY, JSON.stringify({ count: peopleTotal, fetchedAtMs: Date.now() }));
    } catch {
      // stats are cosmetic; a failed fetch just leaves the previous (or no) count showing
    }
  }, []);

  const completeGoogleSignIn = useCallback(async (result: AuthedSession) => {
    await SecureStore.setItemAsync(SESSION_KEY, result.token);
    setSession(result.token);
  }, []);

  const signOut = useCallback(async () => {
    const token = sessionRef.current;
    setSession(null);
    setFeed([]);
    setQueuedItems([]);
    setPendingPosts([]);
    await SecureStore.deleteItemAsync(SESSION_KEY);
    if (token) signOutRequest(token).catch(() => {});
  }, []);

  const value = useMemo<EchoesContextShape>(
    () => ({
      ready,
      signedIn: session !== null,
      feed,
      pendingPosts,
      queuedCount: queuedItems.length,
      fetching,
      statsCount,
      initialLoad,
      checkForNew,
      applyQueued,
      post,
      retryPost,
      feltThis,
      refreshStats,
      completeGoogleSignIn,
      signOut,
    }),
    [ready, session, feed, pendingPosts, queuedItems.length, fetching, statsCount, initialLoad, checkForNew, applyQueued, post, retryPost, feltThis, refreshStats, completeGoogleSignIn, signOut]
  );

  return <EchoesContext.Provider value={value}>{children}</EchoesContext.Provider>;
}

export function useEchoes(): EchoesContextShape {
  const ctx = useContext(EchoesContext);
  if (!ctx) throw new Error('useEchoes must be used within EchoesProvider');
  return ctx;
}

export { ApiError };
