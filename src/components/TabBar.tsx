import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { TabEchoesIcon, TabEntriesIcon, TabPeopleIcon, TabWriteIcon, TabYouIcon } from '../icons/Icons';
import { useApp } from '../state/AppState';
import { Screen } from '../state/types';

const DEFAULT_TRACKING = 1.26;

const WRITE_GROUP: Screen[] = ['today', 'write', 'sealed'];
const ENTRIES_GROUP: Screen[] = ['entries', 'entry', 'search', 'review', 'empty'];
const PEOPLE_GROUP: Screen[] = ['people', 'person', 'newPerson', 'peopleEmpty'];
const ECHOES_GROUP: Screen[] = ['echoes', 'compose', 'signin'];
const YOU_GROUP: Screen[] = ['you', 'privacy', 'paywall', 'appearance', 'checkout', 'purchased'];

export function TabBar() {
  const { screen, reset, goEntries, goPeople } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const writeActive = WRITE_GROUP.includes(screen);
  const entriesActive = ENTRIES_GROUP.includes(screen);
  const peopleActive = PEOPLE_GROUP.includes(screen);
  const echoesActive = ECHOES_GROUP.includes(screen);
  const youActive = YOU_GROUP.includes(screen);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(10, insets.bottom) + 14 }]}>
      <Tab label="Write" active={writeActive} onPress={() => reset('today')} icon={(c) => <TabWriteIcon color={c} />} />
      <Tab label="Entries" tracking={0.99} active={entriesActive} onPress={goEntries} icon={(c) => <TabEntriesIcon color={c} />} />
      <Tab label="People" active={peopleActive} onPress={goPeople} icon={(c) => <TabPeopleIcon color={c} />} />
      <Tab label="Echoes" active={echoesActive} onPress={() => reset('echoes')} icon={(c) => <TabEchoesIcon color={c} />} />
      <Tab label="You" active={youActive} onPress={() => reset('you')} icon={(c) => <TabYouIcon color={c} />} />
    </View>
  );
}

function Tab({
  label,
  active,
  onPress,
  icon,
  tracking,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon: (color: string) => React.ReactNode;
  tracking?: number;
}) {
  const { colors } = useTheme();
  const color = active ? colors.ink : colors.tabInactive;
  return (
    <Pressable onPress={onPress} style={tabStyles.tab}>
      {icon(color)}
      <Text style={[tabStyles.label, { color, letterSpacing: tracking ?? DEFAULT_TRACKING }]}>{label}</Text>
    </Pressable>
  );
}

const tabStyles = StyleSheet.create({
  tab: { flex: 1, alignItems: 'center', gap: 7, paddingVertical: 10 },
  label: { fontFamily: sans(400), fontSize: 9, textTransform: 'uppercase' },
});

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.hair,
      backgroundColor: colors.paper,
      paddingTop: 12,
    },
  });
}
