export type Floor = 'young-10f' | 'young-11f' | 'fashion-10f';

export type Station = {
  id: string;
  name: string;
  hall: string;
  characters: string;
  lead: string;
  floor: Floor;
  /** normalized position on the floor plan image, 0-1 */
  position: { x: number; y: number };
};

export const floors: { id: Floor; label: string; image: number }[] = [
  {
    id: 'young-10f',
    label: '10층 영관',
    image: require('@/assets/images/floorplans/young-10f.jpg'),
  },
  {
    id: 'young-11f',
    label: '11층 영관',
    image: require('@/assets/images/floorplans/young-11f.jpg'),
  },
  {
    id: 'fashion-10f',
    label: '10층 패션관',
    image: require('@/assets/images/floorplans/fashion-10f.jpg'),
  },
];

export const stations: Station[] = [
  {
    id: 'escape-room',
    name: '방탈출',
    hall: '다니엘홀 & 사무엘홀',
    characters: '라합, 노아, 아벨',
    lead: '보민',
    floor: 'young-10f',
    position: { x: 0.35, y: 0.79 },
  },
  {
    id: 'bluffing',
    name: '블러핑',
    hall: '이삭홀',
    characters: '야곱',
    lead: '은규',
    floor: 'young-10f',
    position: { x: 0.42, y: 0.57 },
  },
  {
    id: 'family-of-faith',
    name: '믿음의 가정',
    hall: '아가페홀',
    characters: '아브라함 & 사라',
    lead: '혜선',
    floor: 'young-10f',
    position: { x: 0.52, y: 0.57 },
  },
  {
    id: 'push-challenge',
    name: '미는 챌린지',
    hall: '디모데홀',
    characters: '—',
    lead: '수',
    floor: 'young-10f',
    position: { x: 0.59, y: 0.83 },
  },
  {
    id: 'relay',
    name: '릴레이',
    hall: '요셉홀',
    characters: '요셉',
    lead: '선재',
    floor: 'young-11f',
    position: { x: 0.31, y: 0.84 },
  },
  {
    id: 'domino',
    name: '도미노',
    hall: '새로운홀',
    characters: '—',
    lead: '보람',
    floor: 'fashion-10f',
    position: { x: 0.66, y: 0.61 },
  },
];
