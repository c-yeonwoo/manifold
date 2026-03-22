import { useState, useEffect } from "react";
import { loadJSON, saveJSON } from "@/lib/store";
import { Dumbbell, Plus, Trash2, Zap } from "lucide-react";

const MUSCLE_GROUPS = ["가슴", "등", "어깨", "이두", "삼두", "하체", "복근", "유산소", "전신"];
const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const QUICK_FOODS = [
  { name: "닭가슴살 100g", protein: 31 },
  { name: "계란 1개", protein: 6 },
  { name: "프로틴 셰이크", protein: 25 },
  { name: "그릭 요거트", protein: 15 },
  { name: "두부 100g", protein: 8 },
];

interface ExerciseSet {
  weight: number;
  reps: number;
}

interface Exercise {
  name: string;
  sets: ExerciseSet[];
}

interface ProteinEntry {
  name: string;
  protein: number;
}

export default function HealthPage() {
  const today = new Date().toISOString().slice(0, 10);
  const dayOfWeek = new Date().getDay();

  const [muscleGroup, setMuscleGroup] = useState("가슴");
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: "", sets: [{ weight: 0, reps: 0 }] },
  ]);
  const [attendance, setAttendance] = useState<boolean[]>(() =>
    loadJSON("health_attendance_" + today.slice(0, 7), Array(7).fill(false))
  );
  const [proteinLog, setProteinLog] = useState<ProteinEntry[]>(() =>
    loadJSON("protein_" + today, [])
  );
  const [weight, setWeight] = useState(() => loadJSON("body_weight", 75));
  const PROTEIN_GOAL = 150;

  useEffect(() => {
    saveJSON("health_attendance_" + today.slice(0, 7), attendance);
  }, [attendance, today]);

  useEffect(() => {
    saveJSON("protein_" + today, proteinLog);
  }, [proteinLog, today]);

  const totalProtein = proteinLog.reduce((sum, e) => sum + e.protein, 0);
  const proteinPct = Math.min((totalProtein / PROTEIN_GOAL) * 100, 100);

  const addExercise = () => {
    setExercises((prev) => [...prev, { name: "", sets: [{ weight: 0, reps: 0 }] }]);
  };

  const addSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, { weight: 0, reps: 0 }] } : ex
      )
    );
  };

  const addProtein = (food: { name: string; protein: number }) => {
    setProteinLog((prev) => [...prev, food]);
  };

  const toggleAttendance = (idx: number) => {
    setAttendance((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  return (
    <div className="flex gap-6 animate-fade-up">
      {/* Main content */}
      <div className="flex-1 max-w-2xl">
        {/* Weekly attendance */}
        <div className="flex items-center gap-3 mb-6 stagger-children">
          {DAYS.map((day, i) => (
            <button
              key={day}
              onClick={() => toggleAttendance(i)}
              className={`flex flex-col items-center gap-1 transition-all duration-150 active:scale-[0.95]`}
            >
              <span className="text-[11px] text-muted-foreground">{day}</span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                  attendance[i]
                    ? "border-primary bg-primary/20"
                    : i === (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
                    ? "border-primary/40 animate-pulse-amber"
                    : "border-border"
                }`}
              >
                {attendance[i] && (
                  <Dumbbell className="w-3.5 h-3.5 text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Muscle group selector */}
        <div className="mb-4">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-2">
            운동 부위
          </span>
          <div className="flex flex-wrap gap-1.5">
            {MUSCLE_GROUPS.map((mg) => (
              <button
                key={mg}
                onClick={() => setMuscleGroup(mg)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors duration-150 active:scale-[0.97] ${
                  muscleGroup === mg
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground bg-secondary hover:text-foreground"
                }`}
              >
                {mg}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise logger */}
        <div className="space-y-4 mb-6">
          {exercises.map((ex, exIdx) => (
            <div key={exIdx} className="bg-card rounded-lg border border-border p-4">
              <input
                type="text"
                value={ex.name}
                onChange={(e) =>
                  setExercises((prev) =>
                    prev.map((x, i) => (i === exIdx ? { ...x, name: e.target.value } : x))
                  )
                }
                placeholder="운동 이름 (예: 벤치프레스)"
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full mb-3"
              />
              <div className="space-y-2">
                {ex.sets.map((set, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-muted-foreground w-12">
                      Set {sIdx + 1}
                    </span>
                    <input
                      type="number"
                      value={set.weight || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setExercises((prev) =>
                          prev.map((x, i) =>
                            i === exIdx
                              ? {
                                  ...x,
                                  sets: x.sets.map((s, j) =>
                                    j === sIdx ? { ...s, weight: val } : s
                                  ),
                                }
                              : x
                          )
                        );
                      }}
                      placeholder="kg"
                      className="bg-secondary rounded-md px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none w-20 font-mono text-center"
                    />
                    <span className="text-[11px] text-muted-foreground">kg</span>
                    <input
                      type="number"
                      value={set.reps || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setExercises((prev) =>
                          prev.map((x, i) =>
                            i === exIdx
                              ? {
                                  ...x,
                                  sets: x.sets.map((s, j) =>
                                    j === sIdx ? { ...s, reps: val } : s
                                  ),
                                }
                              : x
                          )
                        );
                      }}
                      placeholder="reps"
                      className="bg-secondary rounded-md px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none w-20 font-mono text-center"
                    />
                    <span className="text-[11px] text-muted-foreground">회</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addSet(exIdx)}
                className="flex items-center gap-1 mt-2 text-[12px] text-muted-foreground hover:text-primary transition-colors duration-150"
              >
                <Plus className="w-3 h-3" /> 세트 추가
              </button>
            </div>
          ))}
          <button
            onClick={addExercise}
            className="w-full py-2 rounded-md border border-dashed border-border text-[13px] text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors duration-150"
          >
            + 운동 추가
          </button>
        </div>

        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-[13px] font-medium hover:brightness-110 transition-all duration-150 active:scale-[0.97]">
          운동 기록 저장
        </button>
      </div>

      {/* Right sidebar */}
      <div className="w-64 space-y-4 stagger-children">
        {/* Protein tracker */}
        <div className="bg-card rounded-lg border border-border p-4">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
            단백질 트래커
          </span>
          <div className="mt-3 mb-2">
            <div className="flex justify-between text-[12px] mb-1">
              <span className="font-mono text-foreground">{totalProtein}g</span>
              <span className="text-muted-foreground">{PROTEIN_GOAL}g</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${proteinPct}%` }}
              />
            </div>
          </div>
          <div className="space-y-1 mt-3">
            {QUICK_FOODS.map((food) => (
              <button
                key={food.name}
                onClick={() => addProtein(food)}
                className="flex items-center justify-between w-full py-1.5 px-2 rounded-md text-[12px] hover:bg-secondary transition-colors duration-150 active:scale-[0.97]"
              >
                <span className="text-foreground">{food.name}</span>
                <span className="font-mono text-primary">+{food.protein}g</span>
              </button>
            ))}
          </div>
          {proteinLog.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              {proteinLog.map((entry, i) => (
                <div key={i} className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="font-mono text-foreground">{entry.protein}g</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body metrics */}
        <div className="bg-card rounded-lg border border-border p-4">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
            신체 지표
          </span>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-foreground">체중</span>
              <span className="font-mono text-sm text-foreground">{weight}kg</span>
            </div>
          </div>
        </div>

        {/* AI analysis placeholder */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
              AI 분석
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            운동을 기록하면 AI가 다음날 플랜과 분석을 제공합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
