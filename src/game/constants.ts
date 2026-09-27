export interface PastelColor {
  id: number;
  name: string;
  main: string;
  light: string;
  fill: string;
  cellGlow: string;
  halo: string;
  border: string;
  freq: number;
}

export const PASTELS: PastelColor[] = [
  {
    id: 0,
    name: 'Lilac',
    main: '#A594F9',
    light: '#D3C5FF',
    fill: 'rgba(165, 148, 249, 0.45)',
    cellGlow: 'rgba(165, 148, 249, 0.75)',
    halo: 'rgba(165, 148, 249, 0.25)',
    border: 'rgba(165, 148, 249, 0.85)',
    freq: 261.63 // C4
  },
  {
    id: 1,
    name: 'Sage Sea',
    main: '#48CAE4',
    light: '#90E0EF',
    fill: 'rgba(72, 202, 228, 0.45)',
    cellGlow: 'rgba(72, 202, 228, 0.75)',
    halo: 'rgba(72, 202, 228, 0.25)',
    border: 'rgba(72, 202, 228, 0.85)',
    freq: 293.66 // D4
  },
  {
    id: 2,
    name: 'Peach Sunset',
    main: '#F4A261',
    light: '#F9C784',
    fill: 'rgba(244, 162, 97, 0.45)',
    cellGlow: 'rgba(244, 162, 97, 0.75)',
    halo: 'rgba(244, 162, 97, 0.25)',
    border: 'rgba(244, 162, 97, 0.85)',
    freq: 329.63 // E4
  },
  {
    id: 3,
    name: 'Mint Flora',
    main: '#52B788',
    light: '#95D5B2',
    fill: 'rgba(82, 183, 136, 0.45)',
    cellGlow: 'rgba(82, 183, 136, 0.75)',
    halo: 'rgba(82, 183, 136, 0.25)',
    border: 'rgba(82, 183, 136, 0.85)',
    freq: 392.00 // G4
  },
  {
    id: 4,
    name: 'Rose Blossom',
    main: '#F28482',
    light: '#F8B4B3',
    fill: 'rgba(242, 132, 130, 0.45)',
    cellGlow: 'rgba(242, 132, 130, 0.75)',
    halo: 'rgba(242, 132, 130, 0.25)',
    border: 'rgba(242, 132, 130, 0.85)',
    freq: 440.00 // A4
  },
  {
    id: 5,
    name: 'Golden Glow',
    main: '#E9C46A',
    light: '#F4E285',
    fill: 'rgba(233, 196, 106, 0.45)',
    cellGlow: 'rgba(233, 196, 106, 0.75)',
    halo: 'rgba(233, 196, 106, 0.25)',
    border: 'rgba(233, 196, 106, 0.85)',
    freq: 523.25 // C5
  }
];

export type GameMode = 'zen' | 'challenging' | 'master';

export interface GameModeInfo {
  id: GameMode;
  name: string;
  badge: string;
  description: string;
}

export const GAME_MODES: Record<GameMode, GameModeInfo> = {
  zen: {
    id: 'zen',
    name: 'Sereno',
    badge: '3-4 colori',
    description: "Percorsi dolci e aperti, ideale per un'esperienza meditativa rilassante."
  },
  challenging: {
    id: 'challenging',
    name: 'Stimolante',
    badge: '4-5 colori',
    description: 'Ancore distanti ai bordi opposti, percorsi lunghi che richiedono logica e spazio.'
  },
  master: {
    id: 'master',
    name: 'Labirinto',
    badge: '5-6 colori',
    description: 'Mappe dense da 60-75 celle, colli di bottiglia Voronoi e incastri intricati.'
  }
};
