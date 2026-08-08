import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { DiaryMoodShape } from '../theme/colors';
import { CARD_WIDTH, HERO_HEIGHT, SURFACED_HEIGHT, phiSpace, phiType } from '../theme/metrics';
import { useApp } from '../state/AppState';
import { PROMPTS } from '../data/content';
import { fullDate, timeLabel, weekdayName } from '../utils/date';
import { wordCount, lastWords } from '../utils/words';
import { buildSurfacedPool, Surfaced } from '../utils/surfaced';
import { firstReadyLetter, nextOpeningLabel, sealedInLabel } from '../utils/letters';

type HeroState = 'sealed' | 'draft' | 'fresh';

export function TodayScreen() {
  const { data, todayIso, todaysEntry, addFragment, navigate, setDraftText, people, letters, openLetter } = useApp();
  const { colors, diaryMood } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [frag, setFrag] = useState('');
  const now = useState(() => new Date())[0];

  const readyLetter = useMemo(() => firstReadyLetter(letters), [letters]);
  const nextOpening = useMemo(() => nextOpeningLabel(letters), [letters]);

  // Computed once per visit to this screen, not on every keystroke elsewhere in the
  // app — HOME_SCREEN_ADDENDUM.md §5 calls for this cached for the session, and a
  // word-frequency scan across every entry has no business re-running per keystroke.
  const [pool] = useState<Surfaced[]>(() => buildSurfacedPool(data, people));
  const [surfacedIndex, setSurfacedIndex] = useState(() => (pool.length ? Math.floor(Date.now() / 86400000) % pool.length : 0));
  const surfaced = pool[surfacedIndex] ?? null;

  const draftWc = wordCount(data.draftText);
  const heroState: HeroState = todaysEntry ? 'sealed' : draftWc > 0 ? 'draft' : 'fresh';
  const prompt = PROMPTS[data.promptIdx % PROMPTS.length];

  const openHero = () => {
    if (heroState === 'sealed' && todaysEntry) {
      navigate('entry', { entryId: todaysEntry.id });
    } else if (heroState === 'draft') {
      navigate('write');
    } else {
      setDraftText(prompt + '\n\n');
      navigate('write');
    }
  };

  const openSurfaced = (s: Surfaced) => {
    switch (s.kind) {
      case 'year_ago':
        if (s.entryId != null) navigate('entry', { entryId: s.entryId });
        break;
      case 'recurring_word':
        navigate('search', { searchQuery: s.query });
        break;
      case 'quiet_person':
        if (s.personId) navigate('person', { personId: s.personId });
        break;
      case 'loose_fragment': {
        const existing = data.draftText.trim();
        setDraftText(existing ? `${existing}\n\n${s.seedText ?? ''}` : s.seedText ?? '');
        navigate('write');
        break;
      }
      case 'letter_teaser':
        navigate('review');
        break;
    }
  };

  const reroll = () => setSurfacedIndex((i) => (pool.length ? (i + 1) % pool.length : 0));

  const submitFrag = () => {
    if (!frag.trim()) return;
    addFragment(frag);
    setFrag('');
  };
  const fragsToday = data.todayFragmentsIso === todayIso ? data.todayFragments : [];

  const hero = heroContent(heroState, { data, todaysEntry, draftWc, prompt }, diaryMood);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: phiSpace.section }} showsVerticalScrollIndicator={false}>
      <View style={styles.gutter}>
        {/* Masthead */}
        <View style={styles.masthead}>
          <View>
            <Text style={styles.mastKicker}>{weekdayName(now).toUpperCase()}</Text>
            <Text style={styles.mastDate}>{fullDate(now).split(', ')[1]}</Text>
          </View>
          <View style={styles.pagesKept}>
            <Text style={styles.pagesNum}>{data.entries.length}</Text>
            <Text style={styles.pagesLabel}>Pages kept</Text>
          </View>
        </View>

        {/* Hero */}
        <Pressable
          onPress={openHero}
          style={({ pressed }) => [styles.hero, pressed && { backgroundColor: colors.paperSunkHover }]}
        >
          <View style={styles.heroTop}>
            <View style={[styles.heroDot, { backgroundColor: hero.dot }]} />
            <Text style={styles.heroKicker}>{hero.kicker}</Text>
          </View>
          <Text style={styles.heroBody} numberOfLines={4}>{hero.body}</Text>
          <View style={styles.heroFooter}>
            <Text style={styles.heroCta}>{hero.cta}</Text>
            <Text style={styles.heroMeta}>{hero.meta}</Text>
          </View>
        </Pressable>

        {/* Surfaced */}
        {surfaced && (
          <View style={styles.surfaced}>
            <View style={styles.surfacedTop}>
              <Text style={styles.surfacedKicker}>{surfaced.kicker}</Text>
              {pool.length > 1 && (
                <Pressable onPress={reroll} hitSlop={8}>
                  <Text style={styles.reroll}>Something else</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.surfacedBody} numberOfLines={2}>{surfaced.body}</Text>
            <Pressable onPress={() => openSurfaced(surfaced)} hitSlop={4}>
              <Text style={styles.surfacedCta}>{surfaced.cta}</Text>
            </Pressable>
          </View>
        )}

        {/* Fragments */}
        <View style={styles.fragBlock}>
          <View style={styles.fragHeader}>
            <Text style={styles.sectionKicker}>Fragments</Text>
            <Text style={styles.fragCount}>{fragsToday.length} today</Text>
          </View>
          {fragsToday.map((f) => (
            <View key={f.id} style={styles.fragRow}>
              <Text style={styles.fragAt}>{f.at}</Text>
              <Text style={styles.fragText}>{f.text}</Text>
            </View>
          ))}
          <View style={styles.fragComposer}>
            <TextInput
              value={frag}
              onChangeText={setFrag}
              onSubmitEditing={submitFrag}
              placeholder="a line, a thought, anything"
              placeholderTextColor={colors.placeholder}
              style={styles.fragInput}
            />
            <Pressable onPress={submitFrag} hitSlop={8}>
              <Text style={[styles.addLabel, { color: frag.trim() ? colors.ink : colors.faint }]}>Add</Text>
            </Pressable>
          </View>
        </View>

        {/* A letter from you is ready — the single most valuable card on this screen, so it
            sits directly under Fragments rather than below the Letters row (§2). */}
        {readyLetter && (
          <Pressable
            onPress={() => {
              openLetter(readyLetter.id);
              navigate('letterOpen', { letterId: readyLetter.id });
            }}
            style={styles.readyCard}
          >
            <View style={[styles.readyDot, { backgroundColor: colors.gold }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.readyTitle}>A letter from you is ready.</Text>
              <Text style={styles.readySub}>{sealedInLabel(readyLetter)}</Text>
            </View>
            <Text style={styles.readyChevron}>›</Text>
          </Pressable>
        )}

        {/* Letters row — always present, so the feature is discoverable before one is ready. */}
        <Pressable onPress={() => navigate('letters')} style={styles.sundayRow}>
          <Text style={styles.sundayLabel}>LETTERS TO LATER</Text>
          <View style={styles.sundayRule} />
          <Text style={styles.sundayValue}>{nextOpening ?? (letters.length === 0 ? 'Write one' : 'None sealed')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function heroContent(
  state: HeroState,
  ctx: { data: ReturnType<typeof useApp>['data']; todaysEntry: ReturnType<typeof useApp>['todaysEntry']; draftWc: number; prompt: string },
  diaryMood: DiaryMoodShape
): { dot: string; kicker: string; body: string; cta: string; meta: string } {
  if (state === 'sealed' && ctx.todaysEntry) {
    return {
      dot: diaryMood.quiet,
      kicker: 'Today is sealed',
      body: `You wrote ${ctx.todaysEntry.wordCount} words tonight. Nobody else will see them.`,
      cta: 'Read it back',
      meta: `Sealed ${timeLabel(ctx.todaysEntry.sealedAtMs)}`,
    };
  }
  if (state === 'draft') {
    return {
      dot: diaryMood.warm,
      kicker: 'You left this open',
      body: `“${lastWords(ctx.data.draftText, 11)}”`,
      cta: 'Finish the sentence',
      meta: `${ctx.draftWc} word${ctx.draftWc === 1 ? '' : 's'} so far`,
    };
  }
  return {
    dot: diaryMood.quiet,
    kicker: "Today's question",
    body: ctx.prompt,
    cta: 'Answer this',
    meta: 'Or write anything',
  };
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, paddingTop: phiSpace.top },
  gutter: { paddingHorizontal: phiSpace.gutter },

  masthead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  mastKicker: { fontFamily: sans(400), fontSize: phiType.label2, letterSpacing: 1.89, textTransform: 'uppercase', color: colors.faint },
  mastDate: { fontFamily: serif(300), fontSize: phiType.heroDate, lineHeight: phiType.heroDate * 0.92, letterSpacing: -1.232, color: colors.ink3, marginTop: 6 },
  pagesKept: { alignItems: 'flex-end', paddingBottom: 3 },
  pagesNum: { fontFamily: serif(300), fontSize: phiType.counter, color: colors.ink3 },
  pagesLabel: { fontFamily: sans(400), fontSize: 9, letterSpacing: 1.26, textTransform: 'uppercase', color: colors.faint2, marginTop: 2 },

  hero: {
    width: CARD_WIDTH,
    height: HERO_HEIGHT,
    backgroundColor: colors.paperSunk,
    padding: phiSpace.gutter,
    marginTop: phiSpace.section,
    justifyContent: 'space-between',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: phiSpace.tight },
  heroDot: { width: 5, height: 5, borderRadius: 2.5 },
  heroKicker: { fontFamily: sans(400), fontSize: phiType.label, letterSpacing: 1.71, textTransform: 'uppercase', color: colors.muted },
  heroBody: { fontFamily: serif(300), fontStyle: 'italic', fontSize: phiType.heroBody, lineHeight: phiType.heroBody * 1.28, color: colors.ink },
  heroFooter: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  heroCta: { fontFamily: sans(400), fontSize: phiType.label2, letterSpacing: 1.575, textTransform: 'uppercase', color: colors.ink },
  heroMeta: { fontFamily: sans(400), fontSize: phiType.label, color: colors.faint },

  surfaced: {
    width: CARD_WIDTH,
    minHeight: SURFACED_HEIGHT,
    borderWidth: 1,
    borderColor: colors.hair,
    padding: phiSpace.gutter,
    paddingVertical: 18,
    marginTop: phiSpace.gap,
    gap: 10,
    justifyContent: 'space-between',
  },
  surfacedTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  surfacedKicker: { fontFamily: sans(400), fontSize: phiType.label, letterSpacing: 1.71, textTransform: 'uppercase', color: colors.faint },
  reroll: { fontFamily: sans(400), fontSize: phiType.label, letterSpacing: 1, textTransform: 'uppercase', color: colors.faint },
  surfacedBody: { fontFamily: serif(300), fontSize: phiType.surfacedBody, lineHeight: phiType.surfacedBody * 1.45, color: colors.ink2 },
  surfacedCta: { fontFamily: sans(400), fontSize: phiType.label, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.ink4 },

  fragBlock: { marginTop: phiSpace.section },
  fragHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 },
  sectionKicker: { fontFamily: sans(400), fontSize: phiType.label, letterSpacing: 1.71, textTransform: 'uppercase', color: colors.faint },
  fragCount: { fontFamily: sans(400), fontSize: phiType.label, color: colors.faint2 },
  fragRow: { flexDirection: 'row', gap: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.hair2 },
  fragAt: { fontFamily: sans(400), fontSize: phiType.label, letterSpacing: 0.4, color: colors.faint2, width: 34, paddingTop: 4 },
  fragText: { fontFamily: serif(300), fontSize: phiType.fragment, lineHeight: phiType.fragment * 1.5, color: colors.ink3, flex: 1 },
  fragComposer: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.hair2, paddingTop: 14, marginTop: 2 },
  fragInput: { flex: 1, fontFamily: serif(300), fontSize: phiType.fragment, color: colors.ink },
  addLabel: { fontFamily: sans(400), fontSize: phiType.label, letterSpacing: 1.4, textTransform: 'uppercase', paddingVertical: 6 },

  sundayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: phiSpace.section, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.hair },
  sundayLabel: { fontFamily: sans(400), fontSize: phiType.label, letterSpacing: 1.235, textTransform: 'uppercase', color: colors.faint2 },
  sundayRule: { flex: 1, height: 1, backgroundColor: colors.hair2 },
  sundayValue: { fontFamily: sans(400), fontSize: phiType.label, color: colors.faint },
  readyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: phiSpace.section,
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: colors.paperSunk,
  },
  readyDot: { width: 7, height: 7, borderRadius: 3.5 },
  readyTitle: { fontFamily: serif(400), fontSize: 18, color: colors.ink },
  readySub: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 0.3, color: colors.muted, marginTop: 5 },
  readyChevron: { fontFamily: sans(400), fontSize: 18, color: colors.chevron },
  });
}
