import React, { useEffect } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';

import { fontAssets } from './src/theme/fonts';
import { ThemeProvider, useTheme } from './src/theme/ThemeState';
import { AppProvider, useApp } from './src/state/AppState';
import { EchoesProvider } from './src/echoes/EchoesState';
import { BillingProvider } from './src/billing/BillingState';
import { TABBED_SCREENS } from './src/state/types';
import { TabBar } from './src/components/TabBar';

import { LockScreen } from './src/screens/LockScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { PasscodeScreen } from './src/screens/PasscodeScreen';
import { OnboardScreen } from './src/screens/OnboardScreen';
import { RemindScreen } from './src/screens/RemindScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { WriteScreen } from './src/screens/WriteScreen';
import { SealedScreen } from './src/screens/SealedScreen';
import { EntriesScreen } from './src/screens/EntriesScreen';
import { EntryScreen } from './src/screens/EntryScreen';
import { EmptyScreen } from './src/screens/EmptyScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { PeopleScreen } from './src/screens/PeopleScreen';
import { PersonScreen } from './src/screens/PersonScreen';
import { NewPersonScreen } from './src/screens/NewPersonScreen';
import { PeopleEmptyScreen } from './src/screens/PeopleEmptyScreen';
import { EchoesScreen } from './src/screens/EchoesScreen';
import { ComposeScreen } from './src/screens/ComposeScreen';
import { NamingScreen } from './src/screens/NamingScreen';
import { SigninScreen } from './src/screens/SigninScreen';
import { LettersScreen } from './src/screens/LettersScreen';
import { NewLetterScreen } from './src/screens/NewLetterScreen';
import { LetterOpenScreen } from './src/screens/LetterOpenScreen';
import { RageScreen } from './src/screens/RageScreen';
import { YouScreen } from './src/screens/YouScreen';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { AppearanceScreen } from './src/screens/AppearanceScreen';
import { PurchasedScreen } from './src/screens/PurchasedScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function Router() {
  const { screen } = useApp();

  switch (screen) {
    case 'lock':
      return <LockScreen />;
    case 'welcome':
      return <WelcomeScreen />;
    case 'passcode':
      return <PasscodeScreen />;
    case 'onboard':
      return <OnboardScreen />;
    case 'remind':
      return <RemindScreen />;
    case 'today':
      return <TodayScreen />;
    case 'write':
      return <WriteScreen />;
    case 'sealed':
      return <SealedScreen />;
    case 'entries':
      return <EntriesScreen />;
    case 'entry':
      return <EntryScreen />;
    case 'empty':
      return <EmptyScreen />;
    case 'review':
      return <ReviewScreen />;
    case 'search':
      return <SearchScreen />;
    case 'people':
      return <PeopleScreen />;
    case 'person':
      return <PersonScreen />;
    case 'newPerson':
      return <NewPersonScreen />;
    case 'peopleEmpty':
      return <PeopleEmptyScreen />;
    case 'echoes':
      return <EchoesScreen />;
    case 'compose':
      return <ComposeScreen />;
    case 'naming':
      return <NamingScreen />;
    case 'signin':
      return <SigninScreen />;
    case 'letters':
      return <LettersScreen />;
    case 'newLetter':
      return <NewLetterScreen />;
    case 'letterOpen':
      return <LetterOpenScreen />;
    case 'rage':
      return <RageScreen />;
    case 'you':
      return <YouScreen />;
    case 'privacy':
      return <PrivacyScreen />;
    case 'paywall':
      return <PaywallScreen />;
    case 'appearance':
      return <AppearanceScreen />;
    case 'purchased':
      return <PurchasedScreen />;
    default:
      return <LockScreen />;
  }
}

function Shell() {
  const { ready, screen } = useApp();
  const { ready: themeReady, colors, paper } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (ready && themeReady) SplashScreen.hideAsync().catch(() => {});
  }, [ready, themeReady]);

  if (!ready || !themeReady) return null;

  const showTabs = TABBED_SCREENS.includes(screen);

  return (
    <View style={[styles.root, { backgroundColor: colors.paper }]}>
      <StatusBar style={paper === 'night' ? 'light' : 'dark'} />
      {/*
        Keyboard avoidance belongs here rather than in each screen. Ten screens take
        text and only one used to handle the keyboard, so the rest let it sit over the
        field being typed into. Under edge-to-edge the window no longer resizes itself,
        so something has to do this explicitly — doing it once means a new screen with a
        text field is correct without anyone having to remember.
      */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {/*
          Android draws edge-to-edge by default from SDK 52 on, so screens sit under the
          status bar. Each screen's own paddingTop was authored against a ~28pt bar, so
          rather than edit all 23 of them the difference is applied once here — the gap
          below the bar then measures the same on a short Android bar and a tall notch.
        */}
        <View style={{ flex: 1, paddingTop: Math.max(0, insets.top - DESIGN_STATUS_BAR) }}>
          <Router />
        </View>
        {showTabs && <TabBar />}
      </KeyboardAvoidingView>
      {/*
        Drawn last and absolutely positioned so it sits above the screens. Padding only
        places content at rest: a ScrollView's children scroll up *through* their own
        padding, which is why list rows were colliding with the clock. An opaque band
        in the app's paper hides them, and matches the status bar's own ground.
      */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: colors.paper,
          zIndex: 10,
          elevation: 10,
        }}
      />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts(fontAssets);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <EchoesProvider>
          <AppProvider>
            {/* Inside AppProvider: billing caches the server's entitlement answer there. */}
            <BillingProvider>
              <Shell />
            </BillingProvider>
          </AppProvider>
        </EchoesProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * The status bar height the screens' own paddingTop values were drawn against. Only
 * the difference from the real inset is added at runtime, so a device that matches
 * this renders exactly as designed and taller bars/notches get exactly the extra
 * they need — no screen has to know about safe areas.
 */
const DESIGN_STATUS_BAR = 28;

const styles = StyleSheet.create({
  root: { flex: 1 },
});
