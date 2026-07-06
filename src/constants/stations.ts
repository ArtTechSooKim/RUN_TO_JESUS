export type Floor = 'young-10f' | 'young-11f' | 'fashion-10f';

/** "RUN TO JESUS" — each station's `letters` are indices into this string. */
export const RUN_TO_JESUS = 'RUNTOJESUS';

/** QR payloads are `RTJ:{id}` (e.g. "RTJ:NOAH") — see files/PROJECT_CONTEXT.md. */
export const QR_PREFIX = 'RTJ:';
export const INTRO_QR_ID = 'INTRO';

/**
 * 2026-07-05 회의로 라합방(구 방탈출)이 R,U,N 세 글자를 통째로 갖는 하나의
 * 스테이션으로 확정됨 — RAHAB을 대표 id로 삼음. NOAH/ABEL은 그 전에 이미
 * 물리 QR/NFC 태그로 인쇄·기록됐을 수 있어 id는 없애지 않고 RAHAB으로
 * 합쳐지도록 별칭 처리. (노아방/아벨방은 이름은 겹치지만 완전히 다른,
 * 글자 배정이 없는 별개의 미니게임이라 NOAH/ABEL과는 무관— 아래 참고.)
 */
export const STATION_ALIASES: Record<string, string> = {
  NOAH: 'RAHAB',
  ABEL: 'RAHAB',
};

export type Station = {
  id: string;
  /** 게임명 (예: "라합방") */
  keyword: string;
  hall: string;
  /** 짧은 헤드라인 */
  characterTitle: string;
  description: string;
  /** 담당자 */
  lead: string;
  /** 장소 미확정인 스테이션은 비워둠 (지도에 아직 표시하지 않음) */
  floor?: Floor;
  color: string;
  emoji: string;
  /** indices into RUN_TO_JESUS collected on completing this station. 글자가 없는 미니게임은 빈 배열 */
  letters: number[];
};

export const floorLabels: Record<Floor, string> = {
  'young-10f': '10층 영관',
  'young-11f': '11층 영관',
  'fashion-10f': '10층 패션관',
};

export const floors: Floor[] = ['young-10f', 'young-11f', 'fashion-10f'];

// Confirmed 2026-07-05 회의 (PROJECT_CONTEXT (1).md) — supersedes the 2026-07-03
// station_fragment_mapping.md naming. 핵심 6 스테이션(글자 배정 있음) +
// 미니게임 3개(겸임, 글자 배정 없음, 장소 일부 미정). RAHAB의 물리 QR/NFC는
// 이미 인쇄·기록됐을 수 있어 id는 유지하고 NOAH/ABEL을 별칭으로 흡수.
export const stations: Station[] = [
  {
    id: 'RAHAB',
    keyword: '라합방',
    hall: '사무엘홀 · 다니엘홀',
    characterTitle: '라합방 탈출 미션',
    description:
      '동시 2세션으로 진행되는 방탈출이에요 (세션1: 사무엘홀·초등부교사실 / 세션2: 다니엘홀·유년부교사실). 제한 시간 안에 흩어진 단서를 모아 탈출구를 찾아보세요.',
    lead: '보민',
    floor: 'young-10f',
    color: '#6EA8FF',
    emoji: '🗝️',
    letters: [0, 1, 2],
  },
  {
    id: 'JOSEPH',
    keyword: '요셉방',
    hall: '요셉홀',
    characterTitle: '이어달리기 릴레이',
    description: '팀이 하나가 되어 완주하는 릴레이 게임. 협력과 속도가 승부를 가릅니다.',
    lead: '선재',
    floor: 'young-11f',
    color: '#F59E0B',
    emoji: '🏃',
    letters: [3],
  },
  {
    id: 'JACOB',
    keyword: '블러핑',
    hall: '이삭홀',
    characterTitle: '진실 혹은 허풍, 블러핑',
    description: '상대의 표정을 읽고 허풍을 간파하세요. 눈치와 배짱이 필요한 게임입니다.',
    lead: '은규',
    floor: 'young-10f',
    color: '#C084FC',
    emoji: '🃏',
    letters: [4],
  },
  {
    id: 'ABRAHAM',
    keyword: '아브라함방',
    hall: '아가페홀',
    characterTitle: '우리 가족의 믿음',
    description: '가정을 주제로 한 이야기와 활동을 함께 나누는 시간입니다.',
    lead: '혜선',
    floor: 'young-10f',
    color: '#A78BFA',
    emoji: '🏠',
    letters: [5],
  },
  {
    id: 'SAMSON',
    keyword: '삼손방',
    hall: '디모데홀',
    characterTitle: '온 힘을 다해, 삼손방',
    description:
      '들릴라의 유혹 영상 후 완전 암전 상태에서 회전 맷돌 구조물을 미는 챌린지가 이어지고, 블레셋 심판 영상과 함께 탈출합니다.',
    lead: '수',
    floor: 'young-10f',
    color: '#EF4444',
    emoji: '💪',
    letters: [6],
  },
  {
    id: 'DAVID',
    keyword: '도미노',
    hall: '새로운홀',
    characterTitle: '연쇄 반응, 도미노',
    description: '작은 도미노 하나가 만드는 큰 연쇄 반응을 함께 완성해보세요.',
    lead: '보람',
    floor: 'fashion-10f',
    color: '#22D3EE',
    emoji: '🎲',
    letters: [7, 8, 9],
  },
  // 아래는 겸임 미니게임 — 글자 배정 없음, 참여 자체가 목적
  {
    id: 'NOAHROOM',
    keyword: '노아방',
    hall: '미정',
    characterTitle: '노아방',
    description: '장소와 세부 내용은 아직 준비 중입니다.',
    lead: '보민',
    color: '#38BDF8',
    emoji: '🚢',
    letters: [],
  },
  {
    id: 'ABELROOM',
    keyword: '아벨방',
    hall: '미정',
    characterTitle: '아벨방',
    description: '장소와 세부 내용은 아직 준비 중입니다.',
    lead: '혜선',
    color: '#FDBA74',
    emoji: '🕯️',
    letters: [],
  },
  {
    id: 'MYSTERYGAME',
    keyword: '미정게임',
    hall: '여호수아홀 (극장)',
    characterTitle: '미정게임',
    description: '세부 내용은 아직 준비 중입니다.',
    lead: '보람',
    color: '#94A3B8',
    emoji: '❓',
    letters: [],
  },
];
