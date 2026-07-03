export type Floor = 'young-10f' | 'young-11f' | 'fashion-10f';

/** "RUN TO JESUS" — each station's `letters` are indices into this string. */
export const RUN_TO_JESUS = 'RUNTOJESUS';

export type Station = {
  id: string;
  hall: string;
  keyword: string;
  characterTitle: string;
  coreQuestion: string;
  description: string;
  verse: string;
  lead: string;
  floor: Floor;
  color: string;
  emoji: string;
  /** indices into RUN_TO_JESUS collected on completing this station */
  letters: number[];
};

export const floorLabels: Record<Floor, string> = {
  'young-10f': '10층 영관',
  'young-11f': '11층 영관',
  'fashion-10f': '10층 패션관',
};

export const floors: Floor[] = ['young-10f', 'young-11f', 'fashion-10f'];

// Mirrors the Figma Make SPACES array (App.tsx) — 7 spaces across 6 game
// activities (방탈출 spans two halls: 다니엘홀 + 사무엘홀, each collected
// separately).
export const stations: Station[] = [
  {
    id: 'daniel',
    hall: '다니엘홀',
    keyword: '방탈출',
    characterTitle: '다니엘 : 믿음을 지킨 사람',
    coreQuestion: '모두가 타협할 때\n당신은 믿음을 지킬 수 있는가?',
    description:
      '사자 굴에서도 흔들리지 않았던 다니엘. 왕의 명령보다 하나님을 선택한 그의 믿음이 역사를 바꾸었습니다.',
    verse: '내 하나님이 그의 천사를 보내어 사자들의 입을 봉하셨으므로 — 다니엘 6:22',
    lead: '보민',
    floor: 'young-10f',
    color: '#6EA8FF',
    emoji: '🦁',
    letters: [0, 1],
  },
  {
    id: 'samuel',
    hall: '사무엘홀',
    keyword: '방탈출',
    characterTitle: '사무엘 : 음성을 들은 사람',
    coreQuestion: '당신은 지금\n하나님의 음성을 듣고 있는가?',
    description:
      '어린 사무엘은 하나님의 음성을 들었습니다. \'말씀하소서, 종이 듣겠나이다.\' 순종이 한 세대의 역사를 새롭게 썼습니다.',
    verse: '말씀하소서 종이 듣겠나이다 — 사무엘상 3:10',
    lead: '보민',
    floor: 'young-10f',
    color: '#34D399',
    emoji: '📜',
    letters: [2, 3],
  },
  {
    id: 'isaac',
    hall: '이삭홀',
    keyword: '블러핑',
    characterTitle: '이삭 : 순종으로 나아간 사람',
    coreQuestion: '이해되지 않을 때도\n순종할 수 있는가?',
    description:
      '모리아 산 위에서 이삭은 자신이 번제물임을 알았습니다. 그럼에도 아버지를 따라 나아간 그의 순종은 믿음의 극치였습니다.',
    verse: '이삭이 번제나무를 자기 등에 지고 아버지를 따라가며 — 창세기 22:6',
    lead: '은규',
    floor: 'young-10f',
    color: '#F472B6',
    emoji: '⛰️',
    letters: [4],
  },
  {
    id: 'agape',
    hall: '아가페홀',
    keyword: '믿음의 가정',
    characterTitle: '아가페홀 : 사랑으로 세운 공동체',
    coreQuestion: '당신의 믿음이\n주변을 세우고 있는가?',
    description:
      '아가페(ἀγάπη)는 조건 없는 하나님의 사랑입니다. 이 사랑이 가정과 공동체를 세우고, 다음 세대에게 믿음을 전수합니다.',
    verse: '사랑은 오래 참고 사랑은 온유하며 — 고린도전서 13:4',
    lead: '혜선',
    floor: 'young-10f',
    color: '#A78BFA',
    emoji: '🏠',
    letters: [5],
  },
  {
    id: 'timothy',
    hall: '디모데홀',
    keyword: '미는 챌린지',
    characterTitle: '디모데 : 두려움 없이 달린 사람',
    coreQuestion: '두려움이 당신의\n발걸음을 멈추게 하는가?',
    description:
      '젊은 디모데는 두려움으로 흔들렸습니다. 바울은 그에게 썼습니다. \'하나님이 주신 것은 두려움의 영이 아니라.\' 그는 달렸습니다.',
    verse: '하나님이 우리에게 두려움의 영이 아니요 오직 능력과 사랑과 절제의 영을 주셨나니 — 디모데후서 1:7',
    lead: '수',
    floor: 'young-10f',
    color: '#FBBF24',
    emoji: '🏃',
    letters: [6],
  },
  {
    id: 'joseph',
    hall: '요셉홀',
    keyword: '릴레이',
    characterTitle: '요셉 : 인내로 완주한 사람',
    coreQuestion: '하나님이 침묵하시는 시간에도\n달릴 수 있는가?',
    description:
      '노예로 팔리고, 감옥에 갇혔지만 요셉은 포기하지 않았습니다. 모든 고난 너머에 하나님의 선한 계획이 있었습니다.',
    verse: '당신들이 나를 이곳에 판 것을 슬퍼하지 마소서 — 창세기 45:5',
    lead: '선재',
    floor: 'young-11f',
    color: '#F59E0B',
    emoji: '🌾',
    letters: [7, 8],
  },
  {
    id: 'newgen',
    hall: '새로운홀',
    keyword: '도미노',
    characterTitle: '새로운홀 : 함께 달리는 공동체',
    coreQuestion: '당신의 한 걸음이\n다음 사람에게 이어지고 있는가?',
    description:
      '도미노처럼, 한 사람의 믿음이 쓰러지면 다음 사람을 일으킵니다. 우리는 혼자 달리지 않습니다. 서로가 서로의 바통입니다.',
    verse: '우리가 선을 행하되 낙심하지 말지니 포기하지 아니하면 때가 이르매 거두리로다 — 갈라디아서 6:9',
    lead: '보람',
    floor: 'fashion-10f',
    color: '#22D3EE',
    emoji: '🎯',
    letters: [9],
  },
];
