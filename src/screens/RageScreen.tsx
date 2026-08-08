import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState as RNAppState,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useApp } from '../state/AppState';

// The Night paper, quoted directly rather than taken from the theme: this screen is always
// this dark regardless of the paper the diary is set to (RITUALS_ADDENDUM.md §4).
const PAPER = '#16151A';
const TEXT = '#E8E4DB';
const DIM = '#8E8A83';
const INERT = '#4A4740';
/** The one accent introduced by this screen, used nowhere else in the app. */
const EMBER = '#C97B5A';

const IDLE_MS = 9000;
const BURN_MS = 2100;
const STAGGER_MS = 70;
const WIPE_MS = 2600;
const REDUCED_FADE_MS = 600;

/**
 * A page for anger that is destroyed instead of kept (RITUALS_ADDENDUM.md §4).
 *
 * Nothing here is persisted at any point: the text lives in component state and nothing else.
 * There is no call to `update()`, no draft field, no blob write, no analytics event — and
 * deliberately no autosave-on-blur, because leaving must discard rather than preserve.
 */
export function RageScreen() {
  const { navigate, reset } = useApp();
  const [text, setText] = useState('');
  const [burning, setBurning] = useState(false);
  const [done, setDone] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef(text);
  textRef.current = text;
  const burningRef = useRef(burning);
  burningRef.current = burning;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false));
  }, []);

  const clearIdle = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const burn = useCallback(() => {
    clearIdle();
    if (burningRef.current || textRef.current.trim().length === 0) return;
    setBurning(true);
    const words = textRef.current.trim().split(/\s+/).length;
    // Hold long enough for the last word's delayed animation to finish before the screen changes.
    const hold = reduceMotion ? REDUCED_FADE_MS + 200 : 2300 + Math.min(words * STAGGER_MS, 1800);
    holdTimer.current = setTimeout(() => {
      setText('');
      setBurning(false);
      setDone(true);
    }, hold);
  }, [clearIdle, reduceMotion]);

  /** Nine seconds of no keystroke, reset on every keystroke — so it never fires mid-thought. */
  const armIdle = useCallback(() => {
    clearIdle();
    if (textRef.current.trim().length === 0) return;
    idleTimer.current = setTimeout(burn, IDLE_MS);
  }, [burn, clearIdle]);

  const onChange = (t: string) => {
    if (burning) return;
    setText(t);
    textRef.current = t;
    armIdle();
  };

  // Backgrounding discards. The text is dropped before the app is suspended, so it is never
  // sitting in a snapshot or a restored session.
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s !== 'active') {
        clearIdle();
        if (holdTimer.current) clearTimeout(holdTimer.current);
        setText('');
        textRef.current = '';
        setBurning(false);
        setDone(false);
      }
    });
    return () => sub.remove();
  }, [clearIdle]);

  useEffect(() => {
    return () => {
      clearIdle();
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, [clearIdle]);

  const leave = () => {
    clearIdle();
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setText('');
    reset('you');
  };

  if (done) {
    return <AfterBurn onAgain={() => setDone(false)} onDone={() => reset('you')} />;
  }

  const hasText = text.trim().length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={leave} hitSlop={10}>
          <Text style={styles.headerSide}>Leave</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Nothing is kept</Text>
        <Pressable onPress={burn} hitSlop={10} disabled={!hasText || burning}>
          <Text style={[styles.headerSide, { color: hasText ? TEXT : INERT }]}>Let it go</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        {burning ? (
          <BurningText text={text} reduceMotion={reduceMotion} />
        ) : (
          <TextInput
            value={text}
            onChangeText={onChange}
            placeholder="Say it as ugly as it actually is."
            placeholderTextColor={INERT}
            multiline
            textAlignVertical="top"
            style={styles.textarea}
            selectionColor={EMBER}
            cursorColor={EMBER}
            autoFocus
            // No learned-word store, no autocorrect memory of what was typed here.
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            keyboardAppearance="dark"
          />
        )}
      </View>

      <View style={styles.footer}>
        {burning && <EmberWipe reduceMotion={reduceMotion} />}
        <Text style={styles.footerHint}>
          {hasText ? 'It will fade on its own when you stop.' : 'Nothing you write here is kept. Not in entries, not anywhere.'}
        </Text>
      </View>
    </View>
  );
}

/**
 * Each word lifts and scatters on its own timing, so the page reads as catching rather than
 * sliding away as a block. Reduced motion keeps the departure but drops the drift and blur.
 */
function BurningText({ text, reduceMotion }: { text: string; reduceMotion: boolean }) {
  const words = useMemo(() => text.trim().split(/\s+/), [text]);
  return (
    <View style={styles.burnWrap}>
      {words.map((w, i) => (
        <BurningWord key={`${i}_${w}`} word={w} index={i} reduceMotion={reduceMotion} />
      ))}
    </View>
  );
}

function BurningWord({ word, index, reduceMotion }: { word: string; index: number; reduceMotion: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: reduceMotion ? REDUCED_FADE_MS : BURN_MS,
      delay: reduceMotion ? 0 : index * STAGGER_MS,
      easing: reduceMotion ? Easing.linear : Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [progress, index, reduceMotion]);

  // ((index % 5) - 2) * 4deg — five tilts, so words scatter instead of moving in step.
  const rotate = `${((index % 5) - 2) * 4}deg`;

  const opacity = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [1, 0.5, 0],
  });

  if (reduceMotion) {
    return <Animated.Text style={[styles.burnWord, { opacity }]}>{word}</Animated.Text>;
  }

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -46] });
  const rotateZ = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', rotate] });

  return (
    <Animated.Text style={[styles.burnWord, { opacity, transform: [{ translateY }, { rotateZ }] }]}>
      {word}
    </Animated.Text>
  );
}

/** A 1px ember line wiping across the footer while the words leave. */
function EmberWipe({ reduceMotion }: { reduceMotion: boolean }) {
  const scale = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: reduceMotion ? REDUCED_FADE_MS : WIPE_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [scale, reduceMotion]);

  // scaleX pivots on the centre, so the line would open outwards from the middle. Translating
  // by half the shortfall pins the left edge in place and lets it wipe rightwards.
  const translateX = scale.interpolate({ inputRange: [0, 1], outputRange: [-width / 2, 0] });

  return (
    <Animated.View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.wipe, { transform: [{ translateX }, { scaleX: scale }] }]}
    />
  );
}

/** No count, no summary, no trace of what was written — only that it is gone. */
function AfterBurn({ onAgain, onDone }: { onAgain: () => void; onDone: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [fade]);

  return (
    <View style={[styles.root, styles.afterRoot]}>
      <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
        <Text style={styles.goneTitle}>Gone.</Text>
        <Text style={styles.goneSub}>
          It was never saved. Not a draft, not a trace — the page does not remember it and neither
          must you.
        </Text>
        <View style={styles.afterActions}>
          <Pressable onPress={onAgain} hitSlop={8}>
            <Text style={styles.afterAction}>There is more</Text>
          </Pressable>
          <Pressable onPress={onDone} hitSlop={8}>
            <Text style={[styles.afterAction, { color: DIM }]}>Done</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAPER, paddingTop: 58 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 18 },
  headerSide: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: DIM },
  headerTitle: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: DIM },
  body: { flex: 1, paddingHorizontal: 26 },
  textarea: { flex: 1, fontFamily: serif(300), fontSize: 23, lineHeight: 37, color: TEXT },
  burnWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  burnWord: { fontFamily: serif(300), fontSize: 23, lineHeight: 37, color: TEXT, marginRight: 8 },
  footer: { paddingHorizontal: 26, paddingBottom: 34, paddingTop: 14 },
  wipe: { height: 1, backgroundColor: EMBER, opacity: 0.5, marginBottom: 12 },
  footerHint: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 0.4, color: DIM, lineHeight: 17 },
  afterRoot: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  goneTitle: { fontFamily: serif(400), fontSize: 28, color: TEXT, textAlign: 'center' },
  goneSub: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 18, lineHeight: 28, color: DIM, textAlign: 'center', marginTop: 14 },
  afterActions: { flexDirection: 'row', gap: 28, marginTop: 34 },
  afterAction: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: TEXT },
});
