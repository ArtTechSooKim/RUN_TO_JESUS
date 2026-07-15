import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import type { Station } from '@/constants/stations';

const FONT = 'Pretendard Variable';

function DimRoom({
  x,
  y,
  w,
  h,
  label,
  sublabel,
  rx = 3,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  sublabel?: string;
  rx?: number;
}) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={rx} fill="#0C1628" stroke="#1A2845" strokeWidth={1} />
      {label && (
        <SvgText
          x={x + w / 2}
          y={y + h / 2 - (sublabel ? 6 : 0)}
          textAnchor="middle"
          fill="#2D4066"
          fontSize={9}
          fontFamily={FONT}
          fontWeight="500">
          {label}
        </SvgText>
      )}
      {sublabel && (
        <SvgText
          x={x + w / 2}
          y={y + h / 2 + 9}
          textAnchor="middle"
          fill="#1E3055"
          fontSize={7.5}
          fontFamily={FONT}>
          {sublabel}
        </SvgText>
      )}
    </G>
  );
}

function GrayBlock({ x, y, w, h, rx = 2 }: { x: number; y: number; w: number; h: number; rx?: number }) {
  return <Rect x={x} y={y} width={w} height={h} rx={rx} fill="#0A1322" stroke="#151F35" strokeWidth={0.8} />;
}

function EvBox({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x} y={y} width={18} height={18} rx={2} fill="#0A1322" stroke="#151F35" strokeWidth={0.8} />
      <SvgText x={x + 9} y={y + 12} textAnchor="middle" fill="#1E3055" fontSize={6}>
        EV
      </SvgText>
    </G>
  );
}

function evStrip(xs: number[], y: number) {
  return xs.map((ex, i) => <EvBox key={i} x={ex} y={y} />);
}

type GameRoomProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  station: Station;
  cleared: boolean;
  selected: boolean;
  onPress: () => void;
  label: string;
  sublabel?: string;
  sessionLabel: string;
  /** Number of teams currently mid-session here (game_sessions status='in_progress') — shows a live "진행중" marker. */
  activeCount?: number;
  /** team_id of every team currently mid-session here — shown on the badge instead of a bare count when there's just one. */
  activeTeamIds?: number[];
  /** Average % through the expected duration, across active sessions here. */
  activePercent?: number;
  rx?: number;
};

const IN_PROGRESS_COLOR = '#FB923C';

/** A real, tappable station room — session name (game) on top, hall name below. */
function GameRoom({
  x,
  y,
  w,
  h,
  station,
  cleared,
  selected,
  onPress,
  label,
  sublabel,
  sessionLabel,
  activeCount = 0,
  activeTeamIds = [],
  activePercent,
  rx = 4,
}: GameRoomProps) {
  const inProgress = activeCount > 0;
  const badgeText = activeTeamIds.length > 0 ? activeTeamIds.join(',') : String(activeCount);
  const badgeFontSize = 7;
  const badgeH = 13;
  const badgeW = Math.min(w - 8, Math.max(badgeH, badgeText.length * (badgeFontSize * 0.62) + 10));
  // When the room is short, the badge eats into the vertically-centered session/label text —
  // push everything down just enough to clear the badge, but leave taller rooms centered as before.
  const centerSessionOffset = h / 2 - (sublabel ? 15 : 10);
  const minSessionOffset = 3 + badgeH + 12;
  const pushDown = inProgress ? Math.max(0, minSessionOffset - centerSessionOffset) : 0;
  const sessionY = y + centerSessionOffset + pushDown;
  const labelY = y + Math.min(h / 2 + 4 + pushDown, h - 14);
  const sublabelY = y + Math.min(h / 2 + 15 + pushDown, h - 4);

  return (
    <G onPress={onPress}>
      <Rect
        x={x - 3}
        y={y - 3}
        width={w + 6}
        height={h + 6}
        rx={rx + 2}
        fill="none"
        stroke={inProgress ? IN_PROGRESS_COLOR : station.color}
        strokeWidth={selected || inProgress ? 2.5 : 1.5}
        opacity={selected || inProgress ? 0.8 : 0.35}
      />
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        fill={`${station.color}${selected ? '30' : '1A'}`}
        stroke={inProgress ? IN_PROGRESS_COLOR : station.color}
        strokeWidth={selected ? 1.8 : 1.2}
        opacity={selected ? 1 : 0.85}
      />
      <Rect x={x + 6} y={y + 1} width={w - 12} height={1.5} rx={1} fill="white" opacity={0.12} />
      {cleared && (
        <G>
          <Circle cx={x + w - 10} cy={y + 10} r={7} fill={`${station.color}40`} stroke={station.color} strokeWidth={1} />
          <SvgText x={x + w - 10} y={y + 13} textAnchor="middle" fill={station.color} fontSize={8} fontWeight="bold">
            ✓
          </SvgText>
        </G>
      )}
      {inProgress && (
        <G>
          <Rect
            x={x + 4}
            y={y + 3}
            width={badgeW}
            height={badgeH}
            rx={badgeH / 2}
            fill={`${IN_PROGRESS_COLOR}40`}
            stroke={IN_PROGRESS_COLOR}
            strokeWidth={1}
          />
          <SvgText
            x={x + 4 + badgeW / 2}
            y={y + 3 + badgeH / 2 + 2.5}
            textAnchor="middle"
            fill={IN_PROGRESS_COLOR}
            fontSize={badgeFontSize}
            fontWeight="bold">
            {badgeText}
          </SvgText>
        </G>
      )}
      <SvgText
        x={x + w / 2}
        y={sessionY}
        textAnchor="middle"
        fill={inProgress ? IN_PROGRESS_COLOR : station.color}
        fontSize={12}
        fontFamily={FONT}
        fontWeight="800">
        {inProgress ? `진행중 ${activePercent ?? 0}%` : sessionLabel}
      </SvgText>
      <SvgText x={x + w / 2} y={labelY} textAnchor="middle" fill={station.color} fontSize={8} opacity={0.65} fontFamily={FONT}>
        {label}
      </SvgText>
      {sublabel && (
        <SvgText x={x + w / 2} y={sublabelY} textAnchor="middle" fill={station.color} fontSize={7} opacity={0.5} fontFamily={FONT}>
          {sublabel}
        </SvgText>
      )}
    </G>
  );
}

type FloorProps = {
  stations: Station[];
  clearedIds: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** station_id -> number of teams currently mid-session there. */
  activeCounts?: Record<string, number>;
  /** station_id -> team_id of every team currently mid-session there. */
  activeTeamIds?: Record<string, number[]>;
  /** station_id -> average % through expected duration, across active sessions there. */
  activePercents?: Record<string, number>;
};

function byId(stations: Station[], id: string) {
  const s = stations.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown station id: ${id}`);
  return s;
}

export function Floor10Young({ stations, clearedIds, selectedId, onSelect, activeCounts = {}, activeTeamIds = {}, activePercents = {} }: FloorProps) {
  const rahab = byId(stations, 'RAHAB');
  const jacob = byId(stations, 'JACOB');
  const abraham = byId(stations, 'ABRAHAM');
  const samson = byId(stations, 'SAMSON');
  const noah = stations.find((s) => s.id === 'NOAHROOM');
  const mystery = stations.find((s) => s.id === 'MYSTERYGAME');

  return (
    <Svg viewBox="0 0 590 460" width="100%" height={undefined} style={{ aspectRatio: 590 / 460 }}>
      {/* building outline */}
      <Rect x={128} y={22} width={388} height={230} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />
      <Rect x={8} y={82} width={120} height={196} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />
      <Rect x={516} y={22} width={58} height={200} rx={29} fill="#0A1220" stroke="#151F35" strokeWidth={1} />
      <Rect x={260} y={4} width={110} height={20} rx={3} fill="#0A1220" stroke="#151F35" strokeWidth={1} />
      <Rect x={8} y={272} width={510} height={157} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />

      <DimRoom x={138} y={30} w={225} h={200} label="본당" />
      <DimRoom x={371} y={30} w={58} h={100} label="방송실" />
      <DimRoom x={371} y={135} w={58} h={115} label="겟세마네홀" sublabel="(침묵기도실)" />
      <DimRoom x={8} y={145} w={120} h={75} label="프레이즈홀" />
      {mystery && (
        <GameRoom
          x={8}
          y={82}
          w={120}
          h={60}
          station={mystery}
          cleared={clearedIds.has(mystery.id)}
          selected={selectedId === mystery.id}
          onPress={() => onSelect(mystery.id)}
          label="여호수아홀"
          sublabel="(새로운극장·고등부)"
          sessionLabel="영화관"
          activeCount={activeCounts[mystery.id]}
          activeTeamIds={activeTeamIds[mystery.id]}
          activePercent={activePercents[mystery.id]}
        />
      )}
      <DimRoom x={8} y={254} w={120} h={16} label="고등부교사실" />
      <DimRoom x={432} y={30} w={82} h={100} label="어노인팅홀" sublabel="(중보기도팀)" />

      {noah && (
        <GameRoom
          x={138}
          y={194}
          w={58}
          h={58}
          station={noah}
          cleared={clearedIds.has(noah.id)}
          selected={selectedId === noah.id}
          onPress={() => onSelect(noah.id)}
          label="플레이그라운드"
          sessionLabel={noah.keyword}
          activeCount={activeCounts[noah.id]}
          activeTeamIds={activeTeamIds[noah.id]}
          activePercent={activePercents[noah.id]}
        />
      )}

      <GameRoom
        x={198}
        y={195}
        w={110}
        h={57}
        station={jacob}
        cleared={clearedIds.has(jacob.id)}
        selected={selectedId === jacob.id}
        onPress={() => onSelect(jacob.id)}
        label="이삭홀 (영아부)"
        sublabel="야곱방"
        sessionLabel="야곱방"
        activeCount={activeCounts[jacob.id]}
        activeTeamIds={activeTeamIds[jacob.id]}
        activePercent={activePercents[jacob.id]}
      />
      <GameRoom
        x={312}
        y={195}
        w={110}
        h={57}
        station={abraham}
        cleared={clearedIds.has(abraham.id)}
        selected={selectedId === abraham.id}
        onPress={() => onSelect(abraham.id)}
        label="아가페홀 (새가족부)"
        sublabel="믿음의 가정"
        sessionLabel="아브라함·사라방"
        activeCount={activeCounts[abraham.id]}
        activeTeamIds={activeTeamIds[abraham.id]}
        activePercent={activePercents[abraham.id]}
      />

      {/* 하단 별동: 라합방(사무엘홀+다니엘홀 병합) · EV/계단 · 삼손방(디모데홀) */}
      <GameRoom
        x={10}
        y={274}
        w={280}
        h={150}
        station={rahab}
        cleared={clearedIds.has(rahab.id)}
        selected={selectedId === rahab.id}
        onPress={() => onSelect(rahab.id)}
        label="사무엘홀 · 다니엘홀"
        sublabel="방탈출 (초등부·유년부교사실 포함)"
        sessionLabel="라합방"
        activeCount={activeCounts[rahab.id]}
        activeTeamIds={activeTeamIds[rahab.id]}
        activePercent={activePercents[rahab.id]}
      />
      <GrayBlock x={294} y={274} w={92} h={150} />
      <SvgText x={340} y={352} textAnchor="middle" fill="#1A2845" fontSize={9} fontFamily={FONT}>
        계단
      </SvgText>
      <GameRoom
        x={390}
        y={274}
        w={126}
        h={150}
        station={samson}
        cleared={clearedIds.has(samson.id)}
        selected={selectedId === samson.id}
        onPress={() => onSelect(samson.id)}
        label="디모데홀 (아동부)"
        sublabel="미는 챌린지 (아동부교사실 포함)"
        sessionLabel="삼손방"
        activeCount={activeCounts[samson.id]}
        activeTeamIds={activeTeamIds[samson.id]}
        activePercent={activePercents[samson.id]}
      />

      <SvgText x={10} y={16} fill="#2D4066" fontSize={10} fontFamily={FONT} fontWeight="600">
        10층 영관
      </SvgText>
    </Svg>
  );
}

export function Floor11Young({ stations, clearedIds, selectedId, onSelect, activeCounts = {}, activeTeamIds = {}, activePercents = {} }: FloorProps) {
  const joseph = byId(stations, 'JOSEPH');
  const jonah = stations.find((s) => s.id === 'ABELROOM');

  return (
    <Svg viewBox="0 0 580 430" width="100%" height={undefined} style={{ aspectRatio: 580 / 430 }}>
      <Rect x={128} y={22} width={390} height={258} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />
      <Rect x={8} y={82} width={120} height={198} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />
      <Rect x={518} y={22} width={54} height={215} rx={27} fill="#0A1220" stroke="#151F35" strokeWidth={1} />
      <Rect x={262} y={4} width={110} height={22} rx={3} fill="#0A1220" stroke="#151F35" strokeWidth={1} />
      <Rect x={128} y={278} width={390} height={88} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />
      <Rect x={8} y={278} width={120} height={148} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />

      <DimRoom x={138} y={35} w={228} h={222} label="본당" />
      <DimRoom x={374} y={35} w={60} h={100} label="방송실" />
      <DimRoom x={438} y={35} w={75} h={100} label="어노인팅홀" sublabel="(중보기도팀)" />
      <DimRoom x={374} y={140} w={60} h={110} label="겟세마네홀" sublabel="(침묵기도실)" />
      <DimRoom x={8} y={82} w={120} h={58} label="새로운극장" sublabel="(고등부)" />
      <DimRoom x={8} y={208} w={120} h={68} label="음향조정실" />
      <DimRoom x={250} y={285} w={268} h={74} label="에스더홀" sublabel="(유치부 / 비활성)" />
      <DimRoom x={136} y={285} w={108} h={74} label="유아부" sublabel="교사실" />
      <GrayBlock x={10} y={352} w={118} h={72} />
      <SvgText x={69} y={390} textAnchor="middle" fill="#1A2845" fontSize={9} fontFamily={FONT}>
        유아부 교사실
      </SvgText>

      {evStrip([527, 527, 527, 527], 32)}
      <GrayBlock x={266} y={5} w={100} h={20} />
      <GrayBlock x={214} y={5} w={50} h={20} />
      <GrayBlock x={372} y={5} w={50} h={20} />

      <GameRoom
        x={10}
        y={280}
        w={118}
        h={68}
        station={joseph}
        cleared={clearedIds.has(joseph.id)}
        selected={selectedId === joseph.id}
        onPress={() => onSelect(joseph.id)}
        label="요셉홀"
        sublabel="릴레이"
        sessionLabel="요셉방"
        activeCount={activeCounts[joseph.id]}
        activeTeamIds={activeTeamIds[joseph.id]}
        activePercent={activePercents[joseph.id]}
      />

      {jonah && (
        <GameRoom
          x={8}
          y={145}
          w={120}
          h={60}
          station={jonah}
          cleared={clearedIds.has(jonah.id)}
          selected={selectedId === jonah.id}
          onPress={() => onSelect(jonah.id)}
          label="다윗홀"
          sublabel="마리아실 겸용"
          sessionLabel="요나방"
          activeCount={activeCounts[jonah.id]}
          activeTeamIds={activeTeamIds[jonah.id]}
          activePercent={activePercents[jonah.id]}
        />
      )}

      <SvgText x={10} y={16} fill="#2D4066" fontSize={10} fontFamily={FONT} fontWeight="600">
        11층 영관
      </SvgText>
    </Svg>
  );
}

export function Floor10Fashion({ stations, clearedIds, selectedId, onSelect, activeCounts = {}, activeTeamIds = {}, activePercents = {} }: FloorProps) {
  const david = byId(stations, 'DAVID');

  return (
    <Svg viewBox="0 0 580 430" width="100%" height={undefined} style={{ aspectRatio: 580 / 430 }}>
      <Rect x={118} y={4} width={110} height={110} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />
      <Rect x={352} y={4} width={118} height={110} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />
      <Path d="M 118,28 Q 228,4 350,28 L 350,4 Q 228,-12 118,4 Z" fill="#0A1220" stroke="#151F35" strokeWidth={1} />
      <Rect x={232} y={8} width={116} height={100} rx={6} fill="#0A1220" stroke="#151F35" strokeWidth={1} />

      <Rect x={0} y={112} width={560} height={262} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />
      <Rect x={38} y={375} width={524} height={50} rx={4} fill="#0A1220" stroke="#151F35" strokeWidth={1} />

      <DimRoom x={122} y={15} w={100} h={92} label="회의실" sublabel="/ 엘림" />
      <DimRoom x={356} y={15} w={108} h={45} label="비전홀" />
      <DimRoom x={356} y={64} w={108} h={43} label="관리팀" />

      <DimRoom x={8} y={118} w={70} h={55} label="엘더스" sublabel="라운지" />
      <DimRoom x={82} y={118} w={130} h={55} label="에버그린실" />
      <DimRoom x={130} y={176} w={80} h={50} label="탕비실" />
      <DimRoom x={8} y={176} w={120} h={50} label="SAEROUN STAFF" />
      <DimRoom x={8} y={230} w={175} h={55} label="NEWGEN STAFF" />
      <DimRoom x={8} y={288} w={175} h={85} label="SAEROUN STAFF" />

      <GrayBlock x={200} y={118} w={135} h={155} />
      <SvgText x={267} y={198} textAnchor="middle" fill="#1A2845" fontSize={9} fontFamily={FONT}>
        계단
      </SvgText>

      <DimRoom x={336} y={285} w={100} h={88} label="목회리더십" sublabel="연구원" />
      <DimRoom x={440} y={285} w={80} h={88} label="뉴젠가정" sublabel="연구소" />
      <DimRoom x={360} y={118} w={192} h={58} label="바울센터" sublabel="(비활성)" />

      <GrayBlock x={42} y={377} w={38} h={46} />
      {evStrip([120, 145, 335, 360, 385, 410, 458, 490], 388)}
      <SvgText x={61} y={403} textAnchor="middle" fill="#1A2845" fontSize={7} fontFamily={FONT}>
        화장실
      </SvgText>
      {evStrip([240, 264, 288, 312], 20)}

      <DimRoom x={200} y={285} w={130} h={88} label="그레이스홀" />

      <GameRoom
        x={360}
        y={178}
        w={192}
        h={105}
        station={david}
        cleared={clearedIds.has(david.id)}
        selected={selectedId === david.id}
        onPress={() => onSelect(david.id)}
        label="새로운홀 (중등부)"
        sublabel="도미노"
        sessionLabel="도미노"
        activeCount={activeCounts[david.id]}
        activeTeamIds={activeTeamIds[david.id]}
        activePercent={activePercents[david.id]}
      />

      <SvgText x={10} y={108} fill="#2D4066" fontSize={10} fontFamily={FONT} fontWeight="600">
        10층 패션관
      </SvgText>
    </Svg>
  );
}
