export type Floor = 'young-10f' | 'young-11f' | 'fashion-10f';

/** "RUN TO JESUS" — each station's `letters` are indices into this string. */
export const RUN_TO_JESUS = 'RUNTOJESUS';

export type Station = {
  id: string;
  name: string;
  hall: string;
  characters: string;
  characterTitle: string;
  keyword: string;
  coreQuestion: string;
  description: string;
  verse: string;
  lead: string;
  floor: Floor;
  /** normalized position on the floor plan image, 0-1 */
  position: { x: number; y: number };
  color: string;
  emoji: string;
  /** indices into RUN_TO_JESUS collected on completing this station */
  letters: number[];
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

// NOTE: characterTitle/keyword/coreQuestion/description/verse are draft
// placeholders for the demo — station leads should review before the event.
export const stations: Station[] = [
  {
    id: 'escape-room',
    name: '방탈출',
    hall: '다니엘홀 & 사무엘홀',
    characters: '라합, 노아, 아벨',
    characterTitle: '라합·노아·아벨 : 준비된 믿음',
    keyword: '준비',
    coreQuestion: '심판이 오기 전,\n당신은 준비되어 있는가?',
    description:
      '노아는 보이지 않는 홍수를 준비했고, 라합은 정탐꾼을 숨겨 살 길을 찾았고, 아벨은 first fruit로 예배했습니다. 세 사람 모두 아직 오지 않은 것을 미리 준비한 믿음의 사람들입니다.',
    verse: '믿음으로 노아는 아직 보이지 않는 일에 경고하심을 받아 경외함으로 방주를 준비하여 — 히브리서 11:7',
    lead: '보민',
    floor: 'young-10f',
    position: { x: 0.35, y: 0.79 },
    color: '#6EA8FF',
    emoji: '🔑',
    letters: [0, 1],
  },
  {
    id: 'relay',
    name: '릴레이',
    hall: '요셉홀',
    characters: '요셉',
    characterTitle: '요셉 : 인내로 완주한 사람',
    keyword: '인내',
    coreQuestion: '하나님이 침묵하시는 시간에도\n당신은 믿을 수 있는가?',
    description:
      '노예로 팔리고 감옥에 갇혔지만 요셉은 포기하지 않았습니다. 모든 고난 너머에 하나님의 선한 계획이 있었습니다.',
    verse: '당신들이 나를 이곳에 판 것을 슬퍼하지 마소서 — 창세기 45:5',
    lead: '선재',
    floor: 'young-11f',
    position: { x: 0.31, y: 0.84 },
    color: '#F59E0B',
    emoji: '🌾',
    letters: [2, 3],
  },
  {
    id: 'bluffing',
    name: '블러핑',
    hall: '이삭홀',
    characters: '야곱',
    characterTitle: '야곱 : 씨름 끝에 변화된 사람',
    keyword: '씨름',
    coreQuestion: '하나님과 씨름한 끝에\n당신은 무엇으로 바뀌는가?',
    description:
      '얍복강에서 밤새 씨름한 야곱은 다리를 절게 되었지만 이스라엘이라는 새 이름을 받았습니다. 속임수로 살아온 인생이 그날 밤 바뀌었습니다.',
    verse: '네 이름을 다시는 야곱이라 부를 것이 아니요 이스라엘이라 부를 것이니 — 창세기 32:28',
    lead: '은규',
    floor: 'young-10f',
    position: { x: 0.42, y: 0.57 },
    color: '#C084FC',
    emoji: '🎭',
    letters: [4, 5],
  },
  {
    id: 'family-of-faith',
    name: '믿음의 가정',
    hall: '아가페홀',
    characters: '아브라함 & 사라',
    characterTitle: '아브라함과 사라 : 약속을 붙든 사람',
    keyword: '약속',
    coreQuestion: '보이지 않는 약속을\n당신은 끝까지 붙들 수 있는가?',
    description:
      '갈 곳을 알지 못한 채 떠난 아브라함과, 웃음으로 약속을 의심했던 사라. 그럼에도 하나님은 이 가정을 믿음의 조상으로 세우셨습니다.',
    verse: '믿음으로 아브라함은 부르심을 받았을 때에 순종하여 나갈 바를 알지 못하고 나아갔으며 — 히브리서 11:8',
    lead: '혜선',
    floor: 'young-10f',
    position: { x: 0.52, y: 0.57 },
    color: '#34D399',
    emoji: '🏠',
    letters: [6, 7],
  },
  {
    id: 'push-challenge',
    name: '미는 챌린지',
    hall: '디모데홀',
    characters: '—',
    characterTitle: '함께 밀어야 넘는 벽',
    keyword: '협력',
    coreQuestion: '혼자서는 넘을 수 없는 벽,\n누구와 함께 밀고 있는가?',
    description:
      '믿음의 경주는 혼자 뛰는 것이 아닙니다. 옆 사람과 함께 힘을 모아야 넘을 수 있는 순간들이 있습니다.',
    verse: '두 사람이 한 사람보다 나음은 그들이 수고함으로 좋은 상을 얻을 것임이라 — 전도서 4:9',
    lead: '수',
    floor: 'young-10f',
    position: { x: 0.59, y: 0.83 },
    color: '#FB923C',
    emoji: '💪',
    letters: [8],
  },
  {
    id: 'domino',
    name: '도미노',
    hall: '새로운홀',
    characters: '—',
    characterTitle: '한 사람이 잇는 다음 세대',
    keyword: '연결',
    coreQuestion: '당신이 넘어뜨린 첫 조각은\n누구에게 이어지는가?',
    description:
      '작은 도미노 하나가 다음 조각을 넘어뜨리듯, 믿음의 바통은 한 사람에게서 다음 사람에게로 이어집니다.',
    verse: '내가 심었고 아볼로는 물을 주었으되 오직 하나님은 자라나게 하셨나니 — 고린도전서 3:6',
    lead: '보람',
    floor: 'fashion-10f',
    position: { x: 0.66, y: 0.61 },
    color: '#22D3EE',
    emoji: '🧩',
    letters: [9],
  },
];
