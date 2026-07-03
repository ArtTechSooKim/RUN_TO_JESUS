# RUN TO JESUS - 스테이션별 믿음의 조각 매핑 스펙

> 앱 콘텐츠 시딩(NFC 태그별 데이터) 참고용. 최종 확정본.

## 개요

- "RUN TO JESUS" 10글자를 6개 게임 스테이션에 분배
- 방탈출만 2개홀(다니엘홀+사무엘홀)에서 동시 2세션으로 운영, 나머지는 1게임=1홀
- 참가자는 자유탐험 순서로 스테이션을 돌며 글자를 획득, 최종 집계 시 10글자 완성

## 매핑 테이블

| 게임 | 담당자 | 공간(홀) | 획득 글자 | 글자 수 |
|---|---|---|---|---|
| 방탈출 | 보민 | 다니엘홀 + 사무엘홀 (동시 2세션 운영) | R, U, N | 3 |
| 릴레이 | 선재 | 요셉홀 | T | 1 |
| 블러핑 | 은규 | 이삭홀 | O | 1 |
| 믿음의 가정 | 혜선 | 아가페홀 | J | 1 |
| 미는 챌린지 | 수 | 디모데홀 | E | 1 |
| 도미노 | 보람 | 새로운홀 | S, U, S | 3 |

**합계: R-U-N-T-O-J-E-S-U-S = 10글자**

## NFC 태그 데이터 구조 (제안)

각 스테이션 NFC 태그에 아래 정보 시딩 필요:

```
station_id: (예: "escape_room", "relay", "bluffing", "family_of_faith", "push_challenge", "domino")
station_name: 게임명 (한글)
location: 홀 이름
fragment_letters: ["R", "U", "N"]  // 배열, 스테이션당 1~3글자
staff_name: 담당자명
```

### 스테이션별 예시 레코드

```json
[
  {
    "station_id": "escape_room",
    "station_name": "방탈출",
    "location": ["다니엘홀", "사무엘홀"],
    "session_mode": "concurrent_2session",
    "fragment_letters": ["R", "U", "N"],
    "staff_name": "보민"
  },
  {
    "station_id": "relay",
    "station_name": "릴레이",
    "location": ["요셉홀"],
    "session_mode": "single",
    "fragment_letters": ["T"],
    "staff_name": "선재"
  },
  {
    "station_id": "bluffing",
    "station_name": "블러핑",
    "location": ["이삭홀"],
    "session_mode": "single",
    "fragment_letters": ["O"],
    "staff_name": "은규"
  },
  {
    "station_id": "family_of_faith",
    "station_name": "믿음의 가정",
    "location": ["아가페홀"],
    "session_mode": "single",
    "fragment_letters": ["J"],
    "staff_name": "혜선"
  },
  {
    "station_id": "push_challenge",
    "station_name": "미는 챌린지",
    "location": ["디모데홀"],
    "session_mode": "single",
    "fragment_letters": ["E"],
    "staff_name": "수"
  },
  {
    "station_id": "domino",
    "station_name": "도미노",
    "location": ["새로운홀"],
    "session_mode": "single",
    "fragment_letters": ["S", "U", "S"],
    "staff_name": "보람"
  }
]
```

## 참고 사항

- 원 제안서(에스더/바울 등)에 있던 인물·홀 매핑은 폐기됨 — 최종 6개 스테이션 기준으로만 콘텐츠 구성할 것
- 방탈출은 2개홀 동시운영이지만 게임/조각 데이터는 하나로 취급 (2개홀 = 같은 게임의 병렬 세션)
- 완료 시 최종 메시지("RUN TO JESUS") 조립 로직: 참가자가 모은 글자를 모아 문자열 완성 여부 체크
- 스테이션별 "인물 스토리" 컨텐츠(예: 다니엘/요셉 등 성경 인물 서사)를 별도로 붙일지는 미확정 — 필요 시 추가 확인 요망
