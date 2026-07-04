import { useState } from 'react';
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
  rx?: number;
};

function GameRoom({ x, y, w, h, station, cleared, selected, onPress, label, rx = 4 }: GameRoomProps) {
  return (
    <G onPress={onPress}>
      <Rect
        x={x - 3}
        y={y - 3}
        width={w + 6}
        height={h + 6}
        rx={rx + 2}
        fill="none"
        stroke={station.color}
        strokeWidth={selected ? 2.5 : 1.5}
        opacity={selected ? 0.7 : 0.35}
      />
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        fill={`${station.color}${selected ? '30' : '1A'}`}
        stroke={station.color}
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
      <SvgText
        x={x + w / 2}
        y={y + h / 2 + 4}
        textAnchor="middle"
        fill={station.color}
        fontSize={11}
        fontFamily={FONT}
        fontWeight="700">
        {label}
      </SvgText>
    </G>
  );
}

function evStrip(xs: number[], y: number) {
  return xs.map((ex, i) => <EvBox key={i} x={ex} y={y} />);
}

type FloorProps = {
  stations: Station[];
  clearedIds: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function byId(stations: Station[], id: string) {
  const s = stations.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown station id: ${id}`);
  return s;
}

export function Floor10Young({ stations, clearedIds, selectedId, onSelect }: FloorProps) {
  // 다니엘홀·사무엘홀은 하나의 방탈출로 취급 — 두 홀 다 같은 station을 가리킴
  const noah = byId(stations, 'NOAH');
  const jacob = byId(stations, 'JACOB');
  const abraham = byId(stations, 'ABRAHAM');
  const samson = byId(stations, 'SAMSON');

  return (
    <Svg viewBox="0 0 580 460" width="100%" height={undefined} style={{ aspectRatio: 580 / 460 }}>
      <Rect x={128} y={22} width={390} height={258} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />
      <Rect x={8} y={82} width={120} height={198} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />
      <Rect x={518} y={22} width={54} height={215} rx={27} fill="#0A1220" stroke="#151F35" strokeWidth={1} />
      <Rect x={262} y={4} width={110} height={22} rx={3} fill="#0A1220" stroke="#151F35" strokeWidth={1} />
      <Rect x={128} y={278} width={390} height={88} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />
      <Rect x={8} y={278} width={120} height={176} rx={4} fill="#0C1628" stroke="#1E2A45" strokeWidth={1.5} />
      <Rect x={128} y={366} width={390} height={86} rx={4} fill="#0A1220" stroke="#151F35" strokeWidth={1} />

      <DimRoom x={138} y={35} w={228} h={222} label="본당" />
      <DimRoom x={374} y={35} w={60} h={100} label="방송실" />
      <DimRoom x={374} y={140} w={60} h={110} label="겟세마네홀" sublabel="(침묵기도실)" />
      <DimRoom x={438} y={35} w={75} h={100} label="어노인팅홀" sublabel="(중보기도팀)" />
      <DimRoom x={8} y={82} w={120} h={58} label="새로운극장" sublabel="(고등부)" />
      <DimRoom x={8} y={145} w={120} h={60} label="프레이즈홀" />
      <DimRoom x={8} y={208} w={120} h={68} label="음향조정실" sublabel="/ 다윗홀" />
      <DimRoom x={132} y={370} w={120} h={78} label="초등부 교사실" />
      <DimRoom x={258} y={370} w={120} h={78} label="유년부 교사실" />
      <DimRoom x={384} y={370} w={130} h={78} label="아동부 교사실" />

      {evStrip([527, 527, 527, 527], 32)}
      <GrayBlock x={266} y={5} w={100} h={20} />
      <GrayBlock x={214} y={5} w={50} h={20} />
      <GrayBlock x={372} y={5} w={50} h={20} />

      <GameRoom
        x={132}
        y={283}
        w={118}
        h={78}
        station={jacob}
        cleared={clearedIds.has(jacob.id)}
        selected={selectedId === jacob.id}
        onPress={() => onSelect(jacob.id)}
        label="이삭홀"
      />
      <GameRoom
        x={256}
        y={283}
        w={118}
        h={78}
        station={abraham}
        cleared={clearedIds.has(abraham.id)}
        selected={selectedId === abraham.id}
        onPress={() => onSelect(abraham.id)}
        label="아가페홀"
      />
      <GameRoom
        x={380}
        y={283}
        w={134}
        h={78}
        station={samson}
        cleared={clearedIds.has(samson.id)}
        selected={selectedId === samson.id}
        onPress={() => onSelect(samson.id)}
        label="디모데홀"
      />
      <GameRoom
        x={10}
        y={280}
        w={118}
        h={82}
        station={noah}
        cleared={clearedIds.has(noah.id)}
        selected={selectedId === noah.id}
        onPress={() => onSelect(noah.id)}
        label="사무엘홀"
      />
      <GameRoom
        x={10}
        y={368}
        w={118}
        h={82}
        station={noah}
        cleared={clearedIds.has(noah.id)}
        selected={selectedId === noah.id}
        onPress={() => onSelect(noah.id)}
        label="다니엘홀"
      />

      <SvgText x={10} y={16} fill="#2D4066" fontSize={10} fontFamily={FONT} fontWeight="600">
        10층 영관
      </SvgText>
    </Svg>
  );
}

export function Floor11Young({ stations, clearedIds, selectedId, onSelect }: FloorProps) {
  const joseph = byId(stations, 'JOSEPH');

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
      <DimRoom x={8} y={145} w={120} h={60} label="다윗홀" sublabel="/ 마리아실" />
      <DimRoom x={8} y={208} w={120} h={68} label="음향조정실" />
      <DimRoom x={250} y={285} w={268} h={74} label="에스더홀" sublabel="(유치부 / 비활성)" />
      <DimRoom x={136} y={285} w={108} h={74} label="유아부" sublabel="교사실" />
      <GrayBlock x={10} y={352} w={118} h={72} />
      <DimRoom x={10} y={352} w={118} h={72} label="유아부 교사실" />

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
      />

      <SvgText x={10} y={16} fill="#2D4066" fontSize={10} fontFamily={FONT} fontWeight="600">
        11층 영관
      </SvgText>
    </Svg>
  );
}

export function Floor10Fashion({ stations, clearedIds, selectedId, onSelect }: FloorProps) {
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
      <SvgText x={267} y={198} textAnchor="middle" fill="#1A2845" fontSize={9}>
        계단
      </SvgText>

      <DimRoom x={200} y={285} w={130} h={88} label="그레이스홀" />
      <DimRoom x={336} y={285} w={100} h={88} label="목회리더십" sublabel="연구원" />
      <DimRoom x={440} y={285} w={80} h={88} label="뉴젠가정" sublabel="연구소" />

      <DimRoom x={360} y={118} w={192} h={58} label="바울센터" sublabel="(비활성)" />

      <GrayBlock x={42} y={377} w={38} h={46} />
      {evStrip([120, 145, 335, 360, 385, 410, 458, 490], 388)}
      <SvgText x={61} y={403} textAnchor="middle" fill="#1A2845" fontSize={7}>
        화장실
      </SvgText>
      {evStrip([240, 264, 288, 312], 20)}

      <GameRoom
        x={360}
        y={178}
        w={192}
        h={105}
        station={david}
        cleared={clearedIds.has(david.id)}
        selected={selectedId === david.id}
        onPress={() => onSelect(david.id)}
        label="새로운홀"
      />

      <SvgText x={10} y={108} fill="#2D4066" fontSize={10} fontFamily={FONT} fontWeight="600">
        10층 패션관
      </SvgText>
    </Svg>
  );
}
