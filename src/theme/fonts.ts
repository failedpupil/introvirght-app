export const fontAssets = {
  'Newsreader-Light': require('../../assets/fonts/Newsreader-Light.ttf'),
  'Newsreader-Regular': require('../../assets/fonts/Newsreader-Regular.ttf'),
  'Newsreader-Medium': require('../../assets/fonts/Newsreader-Medium.ttf'),
  'Newsreader-LightItalic': require('../../assets/fonts/Newsreader-LightItalic.ttf'),
  'InstrumentSans-Regular': require('../../assets/fonts/InstrumentSans-Regular.ttf'),
  'InstrumentSans-Medium': require('../../assets/fonts/InstrumentSans-Medium.ttf'),
};

type Weight = 300 | 400 | 500;

/** Newsreader is the serif used for everything read or written. */
export function serif(weight: Weight = 400, italic = false): string {
  if (italic) return 'Newsreader-LightItalic';
  if (weight === 300) return 'Newsreader-Light';
  if (weight === 500) return 'Newsreader-Medium';
  return 'Newsreader-Regular';
}

/** Instrument Sans is used only for structural micro-labels, uppercase. */
export function sans(weight: 400 | 500 = 400): string {
  return weight === 500 ? 'InstrumentSans-Medium' : 'InstrumentSans-Regular';
}
