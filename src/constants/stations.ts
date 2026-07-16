export type Floor = 'young-10f' | 'young-11f' | 'fashion-10f';

/** "RUN TO JESUS" — each station's `letters` are indices into this string. */
export const RUN_TO_JESUS = 'RUNTOJESUS';

/** QR payloads are `RTJ:{id}` (e.g. "RTJ:NOAH") — see files/PROJECT_CONTEXT.md. */
export const QR_PREFIX = 'RTJ:';
export const INTRO_QR_ID = 'INTRO';

/**
 * Admin-only master tag — tagging it marks every real station complete for
 * the scanning team in one go. Not a real station (no DB row, no letters),
 * so it's kept out of `stations` and handled as a special case wherever a
 * scanned id is resolved. Written/used only from 최고관리자 mode.
 */
export const MASTER_QR_ID = 'MASTER';

export const MASTER_STATION: Station = {
  id: MASTER_QR_ID,
  keyword: '마스터 카드',
  hall: '전체 스테이션',
  characterTitle: '모든 방 즉시 완료',
  description: '태그하면 이 팀의 모든 스테이션이 한번에 완료 처리돼요. 관리자 전용 카드입니다.',
  lead: '관리자',
  color: '#FFD700',
  emoji: '👑',
  letters: [],
};

/**
 * 2026-07-05 회의로 라합방(구 방탈출)이 R,U,N 세 글자를 통째로 갖는 하나의
 * 스테이션으로 확정됨 — RAHAB을 대표 id로 삼음(2026-07 재배치로 라합방은 R 1개만
 * 남고 U/N은 노아방·아벨방으로 분산됨, 아래 stations 참고). NOAH/ABEL은 그 전에
 * 이미 물리 QR/NFC 태그로 인쇄·기록됐을 수 있어 id는 없애지 않고 RAHAB으로 합쳐
 * 지도록 별칭 처리. (station id "NOAHROOM"/"ABELROOM"은 이름은 겹치지만 완전히
 * 다른, 별개의 스테이션이라 이 NOAH/ABEL 별칭과는 무관.)
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
  /** 숨은글자찾기 전용 — 지도/스테이션 목록에서 제외 (당일 QR만 부착, 동선에 없음). */
  isHidden?: boolean;
  /** 숨은글자찾기 전용 — NFC 없이 QR만 사용 (관리자 태그 관리 화면에서 NFC 쓰기 링크를 숨기는 데 씀). */
  isQrOnly?: boolean;
};

export const floorLabels: Record<Floor, string> = {
  'young-10f': '10층 영관',
  'young-11f': '11층 영관',
  'fashion-10f': '10층 패션관',
};

export const floors: Floor[] = ['young-10f', 'young-11f', 'fashion-10f'];

// 2026-07 재배치 확정 (STATION_REASSIGNMENT_GUIDE.md "최종 확정 배치") — 순서는
// 그 가이드의 모자이크 칸 순서(=letters 인덱스 오름차순)를 그대로 따름. 미니게임도
// 이제 전부 실제 글자를 하나씩 배정받아 "겸임 미니게임 = 글자 없음" 구분은 없어짐;
// 대신 노아방/아벨방/영화관은 세션 타이머를 관리자가 아니라 태그 시점에 자동으로
// 시작한다는 의미로 서버의 `is_minigame`이 따로 구분함(여긴 프론트 표시용 데이터라 무관).
export const stations: Station[] = [
  {
    id: 'RAHAB',
    keyword: '라합방',
    hall: '사무엘홀 · 다니엘홀',
    characterTitle: '라합방 탈출 미션',
    description:
      '"너희의 하나님 여호와는 위로는 하늘에서도, 아래로는 땅에서도 하나님이시니라."\n위기의 순간, 한 여인의 믿음의 고백과 선택이 역사를 바꾸었습니다.\n이제 당신도 라합처럼 믿음의 길을 선택하여 끝까지 미션을 완수하세요!\n\n사무엘홀 또는 다니엘홀, 두 곳 중 한 곳에서만 프로그램을 수행하면 완료돼요.',
    lead: '보민',
    floor: 'young-10f',
    color: '#6EA8FF',
    emoji: '🗝️',
    letters: [0],
  },
  {
    id: 'NOAHROOM',
    keyword: '노아방',
    hall: '플레이그라운드',
    characterTitle: '노아방',
    description: '세부 내용은 아직 준비 중입니다.',
    lead: '보민',
    floor: 'young-10f',
    color: '#38BDF8',
    emoji: '🚢',
    letters: [1],
  },
  {
    // 장소가 다윗홀로 확정되며 한 차례 "요나방"으로 개편됐다가 다시 아벨방으로
    // 환원됨. id는 물리 태그 호환을 위해 유지(가이드 §4.1 "기존 row 업데이트"
    // 방식 채택, 별도 alias 불필요 — QR/NFC 페이로드는 항상 station.id를 쓰지
    // 한글명을 쓰지 않음).
    id: 'ABELROOM',
    keyword: '아벨방',
    hall: '다윗홀',
    characterTitle: '아벨방',
    description: '세부 내용은 아직 준비 중입니다.',
    lead: '혜선',
    floor: 'young-11f',
    color: '#FDBA74',
    emoji: '🕯️',
    letters: [2],
  },
  {
    id: 'JOSEPH',
    keyword: '요셉방',
    hall: '요셉홀',
    characterTitle: '이어달리기 릴레이',
    description:
      '꿈은 축복이었지만, 현실은 시련의 연속이었다. 그러나 그는 원망 대신 믿음을, 포기 대신 성실함을 선택했다.\n하나님께서 이루시는 반전의 역사를, 이제 당신이 직접 경험해 보세요.',
    lead: '선재',
    floor: 'young-10f',
    color: '#F59E0B',
    emoji: '🏃',
    letters: [3],
  },
  {
    id: 'JACOB',
    keyword: '야곱방',
    hall: '이삭홀',
    characterTitle: '속고 속여라 야곱방! 그리고...',
    description:
      '야곱, 그 이름은 "발뒤꿈치를 잡는 자" 혹은 "남을 속이는 자." 명석한 두뇌와 꾀로 형도 삼촌도 속이며 살아온 그처럼, 우리 또한 속이고 빼앗으며 올라간다.\n\n당신은 어디까지 속이며 오를 수 있을까? 그리고 그 끝에서 마주할 얍복강가의 밤, 그곳에서 야곱은 새 이름을 얻는데….',
    lead: '은규',
    floor: 'young-10f',
    color: '#C084FC',
    emoji: '🃏',
    letters: [4],
  },
  {
    id: 'ABRAHAM',
    keyword: '아브라함·사라방',
    hall: '아가페홀',
    characterTitle: '실수해도, 함께라면!!',
    description:
      '보이지 않는 약속 하나를 붙들고, 두 사람은 길을 떠났다.\n흔들리던 날도, 넘어지던 순간도 있었지만\n혼자가 아니었기에 다시 일어설 수 있었다.\n결함은 채워지는 것, 완벽해서가 아니라 함께였기에.',
    lead: '혜선',
    floor: 'young-11f',
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
      '한때 누구보다 강했던 남자가 있었다.\n그를 무너뜨린 건 거인도, 군대도 아니었다.\n스스로 옳다고 믿은 선택들이 조금씩 그를 무너뜨렸다.\n이제 당신의 선택이 시험대에 오릅니다.',
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
    letters: [7],
  },
  {
    // 구 "미정게임" — 여호수아홀 위치는 그대로, 정식 이름 확정.
    id: 'MYSTERYGAME',
    keyword: '영화관',
    hall: '여호수아홀',
    characterTitle: '영화관',
    description: '세부 내용은 아직 준비 중입니다.',
    lead: '보람',
    floor: 'young-10f',
    color: '#94A3B8',
    emoji: '🎬',
    letters: [8],
  },
  {
    // 신규 — 장소 당일 결정, QR 전용(NFC 없음). 지도/스테이션 목록에는 절대 노출하지
    // 않음(isHidden) — station/[id] 상세 페이지 자체는 QR 스캔 후 정상 동작.
    id: 'HIDDENLETTER',
    keyword: '숨은글자찾기',
    hall: '미정 (당일 공개)',
    characterTitle: '숨은글자찾기',
    description: '행사 당일 어딘가에 숨겨진 QR코드를 찾아보세요.',
    lead: '김수',
    color: '#FACC15',
    emoji: '🔍',
    letters: [9],
    isHidden: true,
    isQrOnly: true,
  },
];
