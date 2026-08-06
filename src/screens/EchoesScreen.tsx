import React, { useEffect, useMemo, useState } from 'react';
import { AppState as RNAppState, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { useApp } from '../state/AppState';
import { useEchoes } from '../echoes/EchoesState';
import { FEELS, FeelId } from '../data/content';
import { relativeWhen } from '../utils/date';

type Filter = 'all' | FeelId;

export function EchoesScreen() {
  const { navigate } = useApp();
  const { signedIn, feed, pendingPosts, queuedCount, fetching, statsCount, initialLoad, checkForNew, applyQueued, feltThis, refreshStats } = useEchoes();
  const { colors, feelColor, energyColor } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (feed.length === 0) initialLoad();
    else if (signedIn) checkForNew();
    refreshStats();

    if (!signedIn) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!interval) interval = setInterval(() => checkForNew(), 20_000);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    if (RNAppState.currentState === 'active') start();
    const sub = RNAppState.addEventListener('change', (s) => (s === 'active' ? start() : stop()));
    return () => {
      stop();
      sub.remove();
    };
    // initialLoad/checkForNew/refreshStats are stable across renders (see EchoesState.tsx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const visiblePosts = useMemo(
    () => (filter === 'all' ? feed : feed.filter((p) => p.feel === filter)),
    [feed, filter]
  );

  const onRefreshPress = () => {
    if (!signedIn) return navigate('signin');
    checkForNew();
  };

  const onPullRefresh = async () => {
    if (!signedIn) return navigate('signin');
    setRefreshing(true);
    await checkForNew();
    setRefreshing(false);
  };

  const openComposer = () => (signedIn ? navigate('compose') : navigate('signin'));
  const onFeltThis = (id: string) => (signedIn ? feltThis(id) : navigate('signin'));

  const statusLabel = fetching ? 'Listening…' : signedIn ? 'Live' : 'Not signed in';

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={colors.faint} />}
    >
      <View style={{ paddingHorizontal: 26 }}>
        <Text style={styles.title}>Echoes</Text>
        <Text style={styles.sub}>Words only. No photos, no voices, no faces, no follower counts. Say how you feel and let it go.</Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: signedIn ? energyColor.gives : colors.faint2 }]} />
          <Text style={styles.statusLabel}>{statusLabel}</Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={onRefreshPress} hitSlop={8}>
            <Text style={styles.refreshLabel}>{fetching ? '…' : 'Refresh'}</Text>
          </Pressable>
        </View>
      </View>

      <Pressable onPress={openComposer} style={({ pressed }) => [styles.composer, pressed && { backgroundColor: colors.paperSunkHover }]}>
        <Text style={styles.composerPh}>how does it feel right now?</Text>
        <Text style={styles.sayIt}>Say it</Text>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 26, gap: 20 }}>
        <FilterChip label="Everything" active={filter === 'all'} onPress={() => setFilter('all')} />
        {FEELS.map((f) => (
          <FilterChip key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </ScrollView>

      {queuedCount > 0 && (
        <Pressable onPress={applyQueued} style={styles.pill}>
          <View style={[styles.pillDot, { backgroundColor: energyColor.gives }]} />
          <Text style={styles.pillLabel}>{queuedCount} NEW ECHO{queuedCount === 1 ? '' : 'ES'}</Text>
        </Pressable>
      )}

      <View>
        {pendingPosts.map((p) => {
          const feelDef = FEELS.find((f) => f.id === p.feel)!;
          return (
            <View key={p.localId} style={styles.post}>
              <View style={styles.postHeader}>
                <View style={[styles.dot, { backgroundColor: feelColor[p.feel] }]} />
                <Text style={styles.feelLabel}>{feelDef.label}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.echoHair }} />
                <Text style={styles.when}>now</Text>
              </View>
              <Text style={styles.body}>{p.text}</Text>
              <View style={styles.actionsRow}>
                <Text style={styles.byline}>Yours · no name attached</Text>
                {p.status === 'failed' && <RetryTag localId={p.localId} />}
              </View>
            </View>
          );
        })}

        {visiblePosts.map((p) => {
          const feelDef = FEELS.find((f) => f.id === p.feel)!;
          return (
            <View key={p.id} style={styles.post}>
              <View style={styles.postHeader}>
                <View style={[styles.dot, { backgroundColor: feelColor[p.feel] }]} />
                <Text style={styles.feelLabel}>{feelDef.label}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.echoHair }} />
                <Text style={styles.when}>{relativeWhen(p.createdAtMs)}</Text>
              </View>
              <Text style={styles.body}>{p.text}</Text>
              <View style={styles.actionsRow}>
                <Pressable onPress={() => onFeltThis(p.id)} style={styles.feltBtn} hitSlop={8}>
                  <Text style={[styles.feltMark, { color: p.feltByMe ? colors.ink : colors.faint }]}>{p.feltByMe ? '●' : '○'}</Text>
                  <Text style={[styles.feltLabel, { color: p.feltByMe ? colors.ink : colors.faint }]}>{p.felt} felt this</Text>
                </Pressable>
                <Text style={styles.byline}>{p.mine ? 'Yours · no name attached' : 'Anonymous'}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.footnote}>Echoes fade after seven days. Nothing here is a profile.</Text>
      {statsCount !== null && (
        <Text style={styles.statsLine}>{statsCount.toLocaleString()} people have written here</Text>
      )}
    </ScrollView>
  );
}

function RetryTag({ localId }: { localId: string }) {
  const { retryPost } = useEchoes();
  const { colors } = useTheme();
  return (
    <Pressable onPress={() => retryPost(localId)} hitSlop={8}>
      <Text style={{ fontFamily: sans(400), fontSize: 10, letterSpacing: 0.6, color: colors.warn }}>Not sent · retry</Text>
    </Pressable>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={chipStyles.filterChip}>
      <Text style={[chipStyles.filterLabel, { color: active ? colors.ink : colors.faint, borderBottomColor: active ? colors.ink : 'transparent' }]}>{label}</Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  filterChip: { paddingBottom: 9, paddingTop: 2 },
  filterLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase', borderBottomWidth: 1, paddingBottom: 9 },
});

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 66 },
    title: { fontFamily: serif(400), fontSize: 34, letterSpacing: -0.7, color: colors.ink },
    sub: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 17, lineHeight: 25, color: colors.muted, marginTop: 9, maxWidth: 290 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.hair2 },
    statusDot: { width: 5, height: 5, borderRadius: 2.5 },
    statusLabel: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: colors.muted },
    refreshLabel: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: colors.muted },
    composer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 18, paddingVertical: 20, paddingHorizontal: 26, backgroundColor: colors.paperSunk },
    composerPh: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 19, color: colors.muted },
    sayIt: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.ink },
    filterRow: { flexGrow: 0, marginTop: 18 },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 26,
      marginTop: 16,
      paddingVertical: 13,
      backgroundColor: colors.paperSunk,
      borderRadius: 2,
    },
    pillDot: { width: 5, height: 5, borderRadius: 2.5 },
    pillLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.ink },
    post: { padding: 22, paddingHorizontal: 26, borderTopWidth: 1, borderTopColor: colors.hair2 },
    postHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    feelLabel: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.3, textTransform: 'uppercase', color: colors.muted },
    when: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 0.3, color: colors.faint2 },
    body: { fontFamily: serif(300), fontSize: 19, lineHeight: 30, color: colors.ink2 },
    actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 16 },
    feltBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
    feltMark: { fontSize: 14 },
    feltLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1 },
    byline: { fontFamily: sans(400), fontSize: 10, letterSpacing: 0.4, color: colors.faint2 },
    footnote: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 15, lineHeight: 24, color: colors.faint, paddingHorizontal: 26, paddingTop: 28, paddingBottom: 6, borderTopWidth: 1, borderTopColor: colors.hair2 },
    statsLine: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.faint2, paddingHorizontal: 26, paddingBottom: 24 },
  });
}
