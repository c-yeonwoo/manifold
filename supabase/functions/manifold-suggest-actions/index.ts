import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";
import { generateObject } from "npm:ai";
import { z } from "npm:zod";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const body = await req.json();
    const { title, description, layer, kind, horizon, existing } = body ?? {};
    if (!title) {
      return new Response(JSON.stringify({ error: "title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const layerBlurb =
      layer === "base"
        ? "유지(BASE) — 안 하면 깎이는 일관성·에너지"
        : layer === "core"
        ? "축적(CORE) — 할수록 복리로 쌓이는 역량"
        : "산출(OUTPUT) — 쌓은 걸 밖으로 내보내 자산화";

    const gateway = createLovableAiGatewayProvider(key);
    const { object } = await generateObject({
      model: gateway("google/gemini-3-flash-preview"),
      schema: z.object({
        actions: z
          .array(
            z.object({
              label: z.string().describe("한 줄, 30자 이내, 한국어"),
              kind: z.enum(["daily", "todo", "goal"]).describe(
                "daily=매일 체크인 가능한 습관, todo=1~2주 안에 끝낼 단발 할 일, goal=분기/연 단위 목표"
              ),
            })
          )
          .min(3)
          .max(6),
      }),
      prompt: `너는 사용자의 인생 OS(BASE→CORE→OUTPUT) 그래프에서 한 노드를 보고, 그 노드를 실제로 굴리기 위한 실행 단위를 한국어로 제안하는 코치다.

[노드 정보]
- 레이어: ${layerBlurb}
- 종류: ${kind ?? "(미지정)"}
- 시점: ${horizon ?? "(미지정)"}
- 제목: ${title}
- 설명: ${description || "(없음)"}
- 기존 액션: ${Array.isArray(existing) && existing.length ? existing.join(" / ") : "(없음)"}

[지침]
- 3~6개. 기존 액션과 중복 금지.
- 측정/검증 가능하게 (시간·횟수·산출물).
- daily/todo/goal 비율은 노드 성격에 맞게 자동 조정.
- 군더더기 설명·이모지 금지. 한 줄, 30자 이내.`,
    });

    return new Response(JSON.stringify(object), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = /rate|429/i.test(msg) ? 429 : /credit|402|payment/i.test(msg) ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
