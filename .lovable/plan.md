# 데일리 루틴 커스터마이징 + Vision Board 연동

## 목표
- 고정된 루틴(`DEFAULT_ROUTINES`)을 사용자가 직접 편집 가능한 **템플릿**으로 전환
- 템플릿은 **버전(version)** 단위로 보관 — 수정하면 새 버전이 생성되고, 그 시점부터의 일자에 적용
- 루틴 항목은 두 종류:
  1. **커스텀 항목** (사용자가 직접 입력: 찬물샤워, 단백질 기록 등)
  2. **Vision Action 링크** (Goal의 action을 끌어옴 → 루틴 체크가 곧 goal_log 체크로 반영)
- 데일리 루틴에서 체크 시:
  - 커스텀 항목 → 기존처럼 일자별 routine 상태 저장
  - Vision Action 링크 → 해당 goal의 오늘 `goal_log.checked_action_ids`에 자동 반영
- 카테고리(P1/P2/P3) 유지

## DB 스키마

### `routine_templates`
- `id uuid pk`
- `user_id uuid`
- `version int` — 사용자 내 증가 (1, 2, 3…)
- `is_active bool` — 현재 활성 템플릿 단 1개
- `effective_from date` — 이 버전이 적용되기 시작하는 날짜
- `created_at`

### `routine_template_items`
- `id uuid pk`
- `template_id uuid → routine_templates.id`
- `user_id uuid`
- `label text`
- `phase int (1|2|3)`
- `position int`
- `goal_id uuid nullable` — Vision Action 링크 시 source goal
- `action_id text nullable` — goal.actions[].id
- `created_at`

### `routine_logs` (신규, 일자별 체크 상태)
- `id uuid pk`
- `user_id uuid`
- `log_date date`
- `template_id uuid` — 그 날짜에 적용된 템플릿
- `checked_item_ids jsonb` — `routine_template_items.id` 배열
- unique(user_id, log_date)

RLS는 모두 `auth.uid() = user_id`.

## 동작

### 템플릿 버전 관리
- 첫 진입 시 활성 템플릿 없으면 → `DEFAULT_ROUTINES` 기반 v1 자동 시드
- 사용자가 데일리 루틴 페이지에서 "루틴 편집" → 모달/인라인 편집 → 저장 시:
  - 기존 활성 템플릿 `is_active=false`
  - 신규 row insert: `version+1`, `is_active=true`, `effective_from = today`
- 일자별 루틴은 `effective_from <= log_date <= 다음 버전 effective_from` 인 템플릿 사용 (조회 시 가장 최근 `effective_from <= log_date` 템플릿)

### Vision Action 추가
- 편집 모달 내 "Vision Board에서 가져오기" 버튼
- 모든 goals의 actions 리스트에서 다중선택 → phase 지정 후 추가
- item에 `goal_id` + `action_id` 저장. 라벨 `[Health] 단백질 30g 섭취` 형태로 표시

### 체크 동기화
- Sidebar/RoutinePage에서 체크 토글:
  1. `routine_logs` upsert (item.id 추가/제거)
  2. item에 `goal_id`/`action_id`가 있으면 → `goal_logs` upsert: 해당 `action_id`를 `checked_action_ids`에 추가/제거
- 역방향 (goal page에서 체크) 동기화는 이번 범위에서 **제외** (단방향: 루틴 → goal)

## UI 변경

### `RoutinePage.tsx`
- 상단에 **"오늘의 루틴"** 섹션 추가 (체크리스트, P1/P2/P3 분리, 현재 사이드바와 동일한 토글 UI)
- 우상단 `루틴 편집` 버튼 → 모달
- 기존 연간 히트맵은 하단 유지 (data source를 `routine_logs`로 전환)

### `RoutineEditor` (신규 모달)
- phase별 그룹
- 각 항목: 라벨 입력 + 삭제 + 드래그 순서
- "+ 항목 추가" / "+ Vision에서 가져오기"
- 저장 시 새 버전 생성 토스트

### `Sidebar.tsx`
- localStorage 기반 → `useRoutine()` 훅으로 전환 (오늘 템플릿 + 오늘 로그)
- 체크 토글 시 위 동기화 로직 호출

## 신규/수정 파일

**신규**
- `supabase/migrations/<ts>_routine_templates.sql`
- `src/lib/routines.ts` — 데이터 fetch/upsert/sync 헬퍼 + React 훅 `useTodayRoutine()`
- `src/components/routine/RoutineEditor.tsx` — 편집 모달
- `src/components/routine/VisionActionPicker.tsx` — goals의 action 다중선택

**수정**
- `src/pages/RoutinePage.tsx` — 오늘 체크리스트 + 편집 진입점, 히트맵 데이터 소스 교체
- `src/components/layout/Sidebar.tsx` — 새 훅 사용
- `src/integrations/supabase/types.ts` — 마이그레이션 후 자동 갱신

## 마이그레이션 → 기존 데이터
- 기존 localStorage `routine_*` 데이터는 마이그레이션 없이 그대로 두고, 신규 시스템부터 적용 (히트맵은 신규 시스템 데이터로 점진적으로 채워짐)
- 첫 로드 시 `DEFAULT_ROUTINES` 기반 v1 자동 시드되므로 기존 사용 흐름 유지

## 비범위
- goal → routine 역방향 자동 동기화
- 템플릿 히스토리 뷰어/롤백 UI (DB에는 남지만 UI는 추후)
- 게스트 모드(비로그인)는 v1 템플릿 읽기 전용
