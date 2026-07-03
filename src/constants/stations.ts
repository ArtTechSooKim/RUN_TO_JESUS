export type Floor = 'young-10f' | 'young-11f' | 'fashion-10f';

/** "RUN TO JESUS" — each station's `letters` are indices into this string. */
export const RUN_TO_JESUS = 'RUNTOJESUS';

/** QR payloads are `RTJ:{id}` (e.g. "RTJ:NOAH") — see files/PROJECT_CONTEXT.md. */
export const QR_PREFIX = 'RTJ:';
export const INTRO_QR_ID = 'INTRO';

export type Station = {
  id: string;
  /** 게임명 (예: "방탈출") */
  keyword: string;
  hall: string;
  /** 짧은 헤드라인 */
  characterTitle: string;
  description: string;
  /** 담당자 */
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

// Confirmed 2026-07-03 station_fragment_mapping.md (최종 확정본) — supersedes
// the earlier 8-character Hebrews 11 narrative mapping, which that doc
// explicitly discards. Final line-up is 6 games; 방탈출 alone spans three
// already-printed physical QR codes (NOAH/ABEL/RAHAB), so those three ids
// are kept as-is (no reprinting needed) and just relabeled as one game,
// splitting its 3 letters (R,U,N) one-per-QR across them.
export const stations: Station[] = [
  {
    id: 'NOAH',
    keyword: '방탈출',
    hall: '다니엘홀',
    characterTitle: '다니엘홀 탈출 미션',
    description:
      '제한 시간 안에 흩어진 단서를 모아 탈출구를 찾아보세요. 협동과 관찰력이 핵심입니다.',
    lead: '보민',
    floor: 'young-10f',
    color: '#6EA8FF',
    emoji: '🗝️',
    letters: [0],
  },
  {
    id: 'ABEL',
    keyword: '방탈출',
    hall: '사무엘홀',
    characterTitle: '사무엘홀 탈출 미션',
    description:
      '다니엘홀과 같은 방탈출이 사무엘홀에서 동시에 진행됩니다. 팀원들과 힘을 모아보세요.',
    lead: '보민',
    floor: 'young-10f',
    color: '#F472B6',
    emoji: '🗝️',
    letters: [1],
  },
  {
    id: 'RAHAB',
    keyword: '방탈출',
    hall: '다니엘홀 · 사무엘홀',
    characterTitle: '방탈출 추가 미션',
    description:
      '방탈출 참가자를 위한 보너스 미션. 숨겨진 힌트를 찾아내면 조각을 더 모을 수 있어요.',
    lead: '보민',
    floor: 'young-10f',
    color: '#FB923C',
    emoji: '🗝️',
    letters: [2],
  },
  {
    id: 'JOSEPH',
    keyword: '릴레이',
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
    keyword: '믿음의 가정',
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
    keyword: '미는 챌린지',
    hall: '디모데홀',
    characterTitle: '온 힘을 다해, 미는 챌린지',
    description: '온몸으로 부딪히는 파워 게임. 팀의 힘을 하나로 모아보세요.',
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
];
