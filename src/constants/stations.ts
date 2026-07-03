export type Floor = 'young-10f' | 'young-11f' | 'fashion-10f';

/** "RUN TO JESUS" — each station's `letters` are indices into this string. */
export const RUN_TO_JESUS = 'RUNTOJESUS';

/** QR payloads are `RTJ:{id}` (e.g. "RTJ:NOAH") — see files/PROJECT_CONTEXT.md. */
export const QR_PREFIX = 'RTJ:';
export const INTRO_QR_ID = 'INTRO';

export type Station = {
  id: string;
  name: string;
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

// Confirmed 2026-07-03 Saturday planning meeting (files/PROJECT_CONTEXT.md §4).
// 라합(RAHAB) shares 다니엘홀/사무엘홀 with 노아/아벨 and has no dedicated
// room on the floor map — it's still a fully independent QR/station.
export const stations: Station[] = [
  {
    id: 'NOAH',
    name: '방탈출 · 노아방',
    hall: '다니엘홀',
    keyword: '순종',
    characterTitle: '노아 : 보이지 않는 것에 순종한 사람',
    coreQuestion: '보이지 않는 것을 위해\n지금 순종할 수 있는가?',
    description:
      '홍수가 오기 전, 노아는 보이지 않는 경고를 믿고 방주를 지었습니다. 세상의 조롱 속에서도 그는 순종으로 준비했습니다.',
    verse: '믿음으로 노아는 아직 보이지 않는 일에 경고하심을 받아 경외함으로 방주를 준비하여 — 히브리서 11:7',
    lead: '보민',
    floor: 'young-10f',
    color: '#6EA8FF',
    emoji: '🚢',
    letters: [0, 1],
  },
  {
    id: 'ABEL',
    name: '방탈출 · 극장',
    hall: '사무엘홀',
    keyword: '믿음의 예배',
    characterTitle: '아벨 : 믿음으로 예배한 사람',
    coreQuestion: '당신은 무엇으로\n예배하고 있는가?',
    description:
      '아벨은 하나님께 최고의 것을 드렸습니다. 형식이 아니라 믿음으로 드린 예배가 하나님을 기쁘시게 했습니다.',
    verse: '믿음으로 아벨은 가인보다 더 나은 제사를 하나님께 드림으로 의로운 자라 하는 증거를 얻었으니 — 히브리서 11:4',
    lead: '혜선',
    floor: 'young-10f',
    color: '#F472B6',
    emoji: '🔥',
    letters: [2],
  },
  {
    id: 'RAHAB',
    name: '방탈출 · 추가게임',
    hall: '다니엘홀 · 사무엘홀',
    keyword: '용기',
    characterTitle: '라합 : 용기로 결단한 사람',
    coreQuestion: '믿음의 결단을 위해\n무엇을 걸 수 있는가?',
    description:
      '라합은 정탐꾼을 숨기며 위험한 선택을 했습니다. 이방 여인이었지만 그녀의 용기 있는 믿음이 구원의 길이 되었습니다.',
    verse: '믿음으로 기생 라합은 정탐꾼을 평안히 영접하였으므로 순종하지 아니한 자와 함께 멸망하지 아니하였도다 — 히브리서 11:31',
    lead: '보람',
    floor: 'young-10f',
    color: '#FB923C',
    emoji: '🏰',
    letters: [3],
  },
  {
    id: 'JOSEPH',
    name: '릴레이',
    hall: '요셉홀',
    keyword: '인내',
    characterTitle: '요셉 : 인내로 완주한 사람',
    coreQuestion: '하나님이 침묵하시는 시간에도\n달릴 수 있는가?',
    description:
      '노예로 팔리고, 감옥에 갇혔지만 요셉은 포기하지 않았습니다. 모든 고난 너머에 하나님의 선한 계획이 있었습니다.',
    verse: '당신들이 나를 이곳에 판 것을 슬퍼하지 마소서 — 창세기 45:5',
    lead: '선재',
    floor: 'young-11f',
    color: '#F59E0B',
    emoji: '🌾',
    letters: [4, 5],
  },
  {
    id: 'JACOB',
    name: '블러핑',
    hall: '이삭홀',
    keyword: '씨름(돌이킴)',
    characterTitle: '야곱 : 씨름 끝에 변화된 사람',
    coreQuestion: '하나님과 씨름한 끝에\n당신은 무엇으로 바뀌는가?',
    description:
      '얍복강에서 밤새 씨름한 야곱은 다리를 절게 되었지만 이스라엘이라는 새 이름을 받았습니다. 속임수로 살아온 인생이 그날 밤 바뀌었습니다.',
    verse: '네 이름을 다시는 야곱이라 부를 것이 아니요 이스라엘이라 부를 것이니 — 창세기 32:28',
    lead: '은규',
    floor: 'young-10f',
    color: '#C084FC',
    emoji: '🤼',
    letters: [6],
  },
  {
    id: 'ABRAHAM',
    name: '믿음의 가정',
    hall: '아가페홀',
    keyword: '약속을 붙듦',
    characterTitle: '아브라함과 사라 : 약속을 붙든 사람',
    coreQuestion: '보이지 않는 약속을\n당신은 끝까지 붙들 수 있는가?',
    description:
      '갈 곳을 알지 못한 채 떠난 아브라함과, 웃음으로 약속을 의심했던 사라. 그럼에도 하나님은 이 가정을 믿음의 조상으로 세우셨습니다.',
    verse: '믿음으로 아브라함은 부르심을 받았을 때에 순종하여 나갈 바를 알지 못하고 나아갔으며 — 히브리서 11:8',
    lead: '혜선',
    floor: 'young-10f',
    color: '#A78BFA',
    emoji: '⭐',
    letters: [7],
  },
  {
    id: 'SAMSON',
    name: '미는 챌린지',
    hall: '디모데홀',
    keyword: '헌신',
    characterTitle: '삼손 : 마지막까지 헌신한 사람',
    coreQuestion: '당신의 힘은\n무엇을 위해 쓰이고 있는가?',
    description:
      '삼손은 큰 힘을 가졌지만 마지막 순간까지 하나님께 헌신했습니다. 넘어짐 속에서도 그는 다시 하나님을 붙들었습니다.',
    verse: '삼손이 여호와께 부르짖어 이르되 주 여호와여 나를 생각하옵소서 — 사사기 16:28',
    lead: '수',
    floor: 'young-10f',
    color: '#EF4444',
    emoji: '💪',
    letters: [8],
  },
  {
    id: 'DAVID',
    name: '도미노',
    hall: '새로운홀',
    keyword: '작은 믿음의 시작',
    characterTitle: '다윗 : 작은 믿음으로 시작한 사람',
    coreQuestion: '작은 순종이\n어디까지 이어질 수 있는가?',
    description:
      '다윗은 물맷돌 하나로 골리앗 앞에 섰습니다. 작아 보였던 믿음의 시작이 이스라엘 전체를 구원하는 역사로 이어졌습니다.',
    verse: '너는 칼과 창과 단창으로 내게 오나 나는 만군의 여호와의 이름으로 네게 가노라 — 사무엘상 17:45',
    lead: '보람',
    floor: 'fashion-10f',
    color: '#22D3EE',
    emoji: '🪨',
    letters: [9],
  },
];
