export const radius = {
  button: 2,
  none: 0,
} as const;

export const spacing = {
  screenH: 26,
  screenHWide: 34,
  topTabbed: 66,
  topBack: 58,
  topIntro: 74,
} as const;

/** Instrument Sans micro-label base style: uppercase, tracked, structural only. */
export const kicker = {
  fontFamily: 'InstrumentSans-Regular',
  fontSize: 9.5,
  letterSpacing: 1.7, // ~.18em at 9.5px
  textTransform: 'uppercase' as const,
};

export const tabLabel = {
  fontFamily: 'InstrumentSans-Regular',
  fontSize: 9,
  letterSpacing: 1.26, // .14em
  textTransform: 'uppercase' as const,
};

export const buttonLabel = {
  fontFamily: 'InstrumentSans-Regular',
  fontSize: 11,
  letterSpacing: 1.6, // .14-.16em
  textTransform: 'uppercase' as const,
};
