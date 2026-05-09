# 커뮤니티 풀 MVP 구현 플랜

## 결정 사항 (재확인)
- **MVP 범위**: 풀 — 피드 + Streak 리더보드 + 챌린지 + 페어
- **공유 단위**: 익명 핸들 + 페르소나 (나이대/직업/지역)
- **수익화**: 미적용 (커뮤니티 안정화 후)
- **데이터 위치**: 비전 보드(목표/액션) + 월간 지출 요약

## 그동안 바뀐 피처 반영
1. **목표에 `completedAt` 추가** → 공유 카드에 "달성 완료" 뱃지 표시
2. **Life Vision (한 줄)** → 공개 프로필 상단에 노출
3. **루틴 템플릿 v2 (DB)** → Streak 계산은 `routine_logs`만 보면 OK (localStorage 안 봐도 됨)
4. **분기회고** → 공유 토글 가능한 "분기 스냅샷"으로 확장 (Phase 2)
5. **만다라/마인드맵 토글** → 공개 비전 보드도 동일 토글 제공

## 데이터 모델

### `profiles` 컬럼 추가
- `handle text unique` — 자동생성 (`u_xxxxxx`), 사용자 변경 가능
- `persona_age_bucket text` — `'10s'|'20s'|'30s'|'40s'|'50s+'`
- `persona_role text` — 자유 입력 (개발자, 디자이너, 학생…)
- `persona_region text` — 시 단위
- `bio text`
- `is_public bool default false`
- `share_life_vision bool default false`

### 신규 테이블
- `shared_visions` — `user_id, goal_id, snapshot jsonb (title, vision, category, completed), shared_at`
- `shared_finance_summaries` — `user_id, year, month, totals jsonb {category: amount}, note`
- `cheers` — `user_id, target_type ('vision'|'finance'|'streak'), target_id, created_at` unique(user_id, target_type, target_id)
- `challenges` — `id, owner_id, title, description, days int, starts_at, ends_at, is_public`
- `challenge_participants` — `challenge_id, user_id, joined_at, current_streak` unique
- `pairs` — `id, a_user_id, b_user_id, invite_code, created_at, status`

모두 RLS:
- `profiles.is_public = true`인 사용자만 외부에서 SELECT 가능
- `shared_*`는 `is_public` 사용자 데이터만 SELECT, INSERT/UPDATE/DELETE는 owner
- `cheers` 본인 것만 INSERT/DELETE, 모두 SELECT
- `pairs`는 양쪽 user만 SELECT

### Helper 함수
- `public.compute_streak(uid uuid) returns int` — `routine_logs`에서 연속일 계산
- `public.get_pair_partner(pair_id uuid) returns uuid` — RLS bypass용

## UI

### `/community` (탭 4개)
- **피드** — 최신 `shared_visions` + `shared_finance_summaries` + 챌린지 완료 카드 혼합
- **Streak** — `compute_streak` 기준 상위 50명 리더보드 (익명 핸들 + 페르소나)
- **챌린지** — 진행중/모집중 카드 + 만들기 버튼
- **페어** — 내 페어 위젯 + 초대 코드 입력

### `/u/:handle` 공개 프로필
- 페르소나 칩 + Life Vision (공개시) + 공개된 비전 카드 그리드 + 현재 Streak

### `/settings/profile`
- 페르소나 입력 + 핸들 변경 + 공개 토글 + Life Vision 공개 여부

### 기존 페이지 수정
- `GoalDetailPage` — 우상단 "공개" 토글 (snapshot upsert/delete)
- `FinancePage` — 월말 "이달 지출 공유하기" 버튼
- `TopNav` — `커뮤니티` 탭 추가
- `Sidebar` — 페어 미니 위젯 (Phase 2)

## 신규 컴포넌트
- `community/VisionShareCard`, `FinanceShareCard`, `StreakRow`, `ChallengeCard`, `PairWidget`
- `community/ShareToggle`, `PersonaForm`, `CheerButton` (낙관적 업데이트)

## 신규 라이브러리
- `src/lib/community.ts` — 피드 fetch, snapshot upsert, cheer toggle
- `src/lib/streak.ts` — `routine_logs` 연속일 계산 (서버 함수 래퍼)
- `src/lib/challenges.ts`, `src/lib/pairs.ts`

## 구현 순서 (3 phase)
1. **Phase 1 (이번 작업)** — DB 마이그레이션 + 페르소나 설정 + 공개 토글 + 피드 + 응원 + 공개 프로필
2. **Phase 2** — Streak 리더보드 + 챌린지 + 페어
3. **Phase 3** — 알림, AI 주간 피드백, 모더레이션

이번 메시지에서는 **Phase 1 전체 + Phase 2 기본 골격(스키마+페이지 placeholder)** 까지 한 번에 진행할게.

## 비범위
- 이미지 업로드 (이니셜/색상으로 대체)
- 실시간 채팅
- 결제/Pro 게이트
- 댓글 (응원 이모지만)
