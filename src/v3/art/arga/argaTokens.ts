export const ARGA_CANONICAL_DIMENSIONS = {
  scaleHeads: 7.5,
  totalHeight: 760,
  crownY: -755,
  skullTopY: -746,
  eyeY: -698,
  chinY: -644,
  neckBaseY: -614,
  shoulderY: -598,
  shoulderHalfWidthFront: 66,
  chestY: -522,
  waistY: -460,
  pelvisY: -424,
  hipY: -410,
  hipHalfWidthFront: 23,
  thighLength: 198,
  shinLength: 186,
  ankleRestY: -30,
  bootHeight: 30,
  upperArmLength: 132,
  forearmLength: 122,
  coatHemY: -214,
} as const;

export const ARGA_PALETTE = {
  skin: {
    base: '#ECC6A8',
    shadow: '#D4A181',
    deep: '#B98366',
    highlight: '#F8DFCA',
    ink: '#3E2B26',
  },
  hair: {
    base: '#252D42',
    shadow: '#171C2C',
    highlight: '#4A5678',
    ink: '#131726',
  },
  eye: {
    sclera: '#F6F7FB',
    scleraShadow: '#CBD2E0',
    irisBase: '#5D7B9B',
    irisDark: '#2E435A',
    irisLight: '#9CC1E2',
    pupil: '#172130',
    lash: '#151928',
  },
  coat: {
    base: '#2B334B',
    shadow: '#1E2438',
    deep: '#151929',
    highlight: '#3F4969',
    ink: '#131726',
  },
  shirt: {
    base: '#CBC8C2',
    shadow: '#A7A49F',
    deep: '#8E8B87',
    highlight: '#E2DFD9',
    ink: '#393C47',
  },
  belt: {
    base: '#543F36',
    shadow: '#382822',
    buckle: '#C2C4CA',
    buckleShadow: '#7B7E88',
    ink: '#211917',
  },
  trousers: {
    base: '#464954',
    shadow: '#31343E',
    highlight: '#5D6170',
    ink: '#1D1F28',
  },
  boots: {
    base: '#4C3A34',
    shadow: '#322521',
    sole: '#221B19',
    highlight: '#6D564E',
    ink: '#1D1614',
  },
} as const;

export const makeActorDefsId = (instanceId: string, token: string): string => {
  const safeInstance = instanceId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeToken = token.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `v3-${safeInstance}-${safeToken}`;
};
