## 컨셉

"원하는 건 뭐든 이뤄진다" — 잠재의식·시각화 기반 목표 트래커.
'나'를 중심으로 6개 분야가 뻗어나가는 마인드맵 홈, 분야별 최대 3개 목표, 목표마다 비전 + 액션 + 일지.

## 6개 카테고리 (마인드맵 노드)

```
              [Growth]         [Play]
                  \\           /
        [Wealth] — ( 나 ) — [Love]
                  /           \\
              [Health]         [Work]
```

- **Health** — 신체, 운동, 식단, 단백질
- **Wealth** — 자산, 투자, 부동산, 포트폴리오
- **Work** — 커리어, 프로젝트, 업무 성장
- **Love** — 관계, 가족, 파트너십
- **Growth** — 학습 (언어/독서/경제 공부 흡수)
- **Play** — 취미, 여가, 창의

각 카테고리는 색상 토큰으로 구분 (디자인 시스템 내 hsl 기반).

## 메인 화면: 마인드맵 홈 (`/`)

- SVG 기반, 중앙 '나' 노드 + 6개 카테고리 노드가 방사형으로 배치
- 각 카테고리 노드에서 그 분야에 등록된 목표(최대 3개)가 작은 자식 노드로 한 단계 더 뻗어나감
- 노드에 오늘 진척률 링(예: 2/3 액션 완료) 표시
- 카테고리 노드 클릭 → 카테고리 페이지(목표 리스트 + 추가)
- 목표 노드 클릭 → 목표 상세 페이지
- 부드러운 SVG 라인, hover 시 강조, framer-motion으로 등장 애니메이션

## 카테고리 페이지 (`/category/:key`)

- 해당 분야의 목표 카드 1~3개 + "목표 추가" 버튼 (3개 도달 시 비활성)
- 목표 생성 모달: 제목, 한 줄 비전, 기한(선택), 핵심 액션 아이템들

## 목표 상세 페이지 (`/category/:key/goal/:id`)

1. **비전 패널** — 큰 타이포로 "나는 ___이다/한다" 형태 단언문, 관련 이미지 URL(선택), 동기 메모
2. **오늘의 액션 체크리스트** — 매일 반복되는 액션 토글, 체크 시 기록에 자동 반영
3. **일자별 기록(저널)** — 날짜별 한 줄 메모 + 자유 텍스트, Cmd+Enter 저장
4. **진척도 바** — 누적 액션 완료 수 / 연속 일수 / 시작 후 경과일

## 사이드바 / 네비

- 사이드바 P1·P2·P3 데일리 루틴 체크는 그대로 유지 (사용자가 좋다고 함)
- 상단 네비 단순화: **홈(마인드맵) / 루틴 / 지출** 3개만
- 기존 페이지(경제·일본어·영어·헬스·부동산·독서·포트폴리오) 라우트와 파일은 **삭제**, 해당 활동은 각 카테고리 목표의 액션으로 사용자가 직접 등록
- 루틴(히트맵), 지출은 그대로 유지

## 데이터 모델 (localStorage, `src/lib/store.ts` 확장)

```ts
type CategoryKey = "health"|"wealth"|"work"|"love"|"growth"|"play";

interface Goal {
  id: string;
  category: CategoryKey;
  title: string;          // "월 1천 저축"
  vision: string;         // "나는 매달 안정적으로 저축한다"
  imageUrl?: string;
  deadline?: string;
  createdAt: string;
  actions: ActionItem[];  // 반복 체크 항목
}
interface ActionItem { id: string; label: string; }
interface GoalLog {
  goalId: string;
  date: string;           // YYYY-MM-DD
  checkedActionIds: string[];
  note: string;
}
```

키: `goals`(전체 배열), `goal_log_{goalId}_{date}`.

## 파일 변경

**신규**
- `src/pages/MindmapHome.tsx` — 메인 마인드맵
- `src/pages/CategoryPage.tsx` — 분야별 목표 리스트
- `src/pages/GoalDetailPage.tsx` — 비전 + 액션 + 일지 + 진척도
- `src/components/mindmap/MindmapCanvas.tsx` — SVG 노드/엣지
- `src/components/goals/GoalForm.tsx` — 생성/편집 모달
- `src/lib/goals.ts` — CRUD 헬퍼

**수정**
- `src/App.tsx` — 라우트 재구성
- `src/components/layout/TopNav.tsx` — 3개 탭으로 축소
- `src/lib/store.ts` — Goal/Log 타입 + 카테고리 메타

**삭제**
- `EconomyPage.tsx`, `JapanesePage.tsx`, `EnglishPage.tsx`, `HealthPage.tsx`, `PropertyPage.tsx`, `ReadingPage.tsx`, `PortfolioPage.tsx`

**유지**
- `RoutinePage.tsx`, `FinancePage.tsx`, `Sidebar.tsx`(루틴 체크)

## 디자인 노트

- 다크 #0d0e10 + 앰버 #c8a96e 기조 유지
- 카테고리별 액센트 컬러 6종을 hsl 토큰으로 `index.css`에 추가
- 마인드맵: 중앙 노드는 큰 원형, 카테고리 노드는 중간 원형 + 아이콘(lucide), 목표 노드는 작은 pill
- framer-motion으로 노드 stagger 등장, 라인은 SVG path drawing 애니메이션
- "원하는 건 뭐든 이뤄진다" 같은 만트라를 홈 하단에 은은하게 노출
