import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

  useEffect(() => {
    if (ready && themeReady) SplashScreen.hideAsync().catch(() => {});
  }, [ready, themeReady]);

  if (!ready || !themeReady) return null;

  const showTabs = TABBED_SCREENS.includes(screen);

  return (
    <View style={[styles.root, { backgroundColor: colors.paper }]}>
      <StatusBar style={paper === 'night' ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        <Router />
      </View>
      {showTabs && <TabBar />}
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

const styles = StyleSheet.create({
  root: { flex: 1 },
});
