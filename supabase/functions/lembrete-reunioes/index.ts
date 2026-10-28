import { createClient } from "npm:@supabase/supabase-js@2";
import { contaGoogle } from "../_shared/google.ts";

// Lembrete 1h antes de cada reunião marcada: manda um e-mail para o Thomás com o botão que abre o
// WhatsApp do cliente com a confirmação pronta (o envio no WhatsApp é manual) e o link da chamada.
// Chamada a cada 5 minutos pelo pg_cron (schema_lembrete_reunioes.sql), publicada sem verificação: quem
// chamar só dispara o lembrete para o próprio Thomás, uma vez por reunião (lembrete_enviado_em).
// Segredos: RESEND_API_KEY, EMAIL_REMETENTE (opcional) e LEMBRETE_EMAIL (opcional; padrão: o e-mail da
// conta Google conectada).

const TZ = "America/Sao_Paulo";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const REMETENTE = Deno.env.get("EMAIL_REMETENTE") || "Thomás · Last Lab <contato@lastlab.com.br>";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://lastlab.com.br").replace(/\/$/, "");
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const ANTECEDENCIA_MIN = 65; // pega o que começa na próxima 1h (com folga para o intervalo de 5 min)

Deno.serve(async (req) => {
  try {
    if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY não configurada." }, 500);
    const agora = new Date();
    const { data: reunioes, error } = await supabase
      .from("reunioes")
      .select("*, lead:diagnosticos(id, nome, whatsapp, apresentacao, empresa:dados->>empresa)")
      .eq("status", "marcada")
      .is("lembrete_enviado_em", null)
      .gte("inicio", agora.toISOString())
      .lte("inicio", new Date(agora.getTime() + ANTECEDENCIA_MIN * 60000).toISOString());
    if (error) throw error;
    if (!reunioes?.length) return json({ ok: true, enviados: 0 });

    const destino = Deno.env.get("LEMBRETE_EMAIL") || (await contaGoogle(supabase))?.email;
    if (!destino) return json({ error: "Sem destino: conecte o Google ou defina LEMBRETE_EMAIL." }, 500);

    let enviados = 0;
    for (const r of reunioes) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: REMETENTE, to: [destino], subject: `Em 1h: ${r.titulo} às ${hora(r.inicio)}`, html: emailLembrete(r) }),
      });
      if (!res.ok) { console.error("Resend", res.status, await res.text()); continue; }
      await supabase.from("reunioes").update({ lembrete_enviado_em: new Date().toISOString() }).eq("id", r.id);
      enviados++;
    }
    return json({ ok: true, enviados });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const esc = (s: string) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

// deno-lint-ignore no-explicit-any
function mensagemWhats(r: any) {
  const nome = (r.lead?.nome || "").trim().split(/\s+/)[0];
  const linhas = [`Oi${nome ? `, ${nome}` : ""}! Passando para confirmar a nossa conversa de hoje, às ${hora(r.inicio)}.`];
  if (/^https?:\/\//.test(r.local || "")) linhas.push(`O link da chamada é este: ${r.local}`);
  linhas.push("Até já!");
  return linhas.join("\n\n");
}

// deno-lint-ignore no-explicit-any
function emailLembrete(r: any) {
  const empresa = r.lead?.apresentacao?.empresa || r.lead?.empresa || "";
  const cliente = [empresa, r.lead?.nome].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(" · ");
  const d = (r.lead?.whatsapp || "").replace(/\D/g, "");
  const whats = d ? `https://wa.me/${d.length <= 11 ? "55" + d : d}?text=${encodeURIComponent(mensagemWhats(r))}` : "";
  const link = /^https?:\/\//.test(r.local || "") ? r.local : "";
  const botao = (href: string, texto: string, cor: string) =>
    `<a href="${esc(href)}" style="display:inline-block;background:${cor};color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:999px;margin:0 8px 8px 0">${texto}</a>`;
  return `<div style="font-family:Helvetica,Arial,sans-serif;color:#1F1D2B;max-width:520px;margin:0 auto;padding:24px">
  <p style="color:#E2564A;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;margin:0">Reunião em 1 hora</p>
  <h1 style="font-size:26px;margin:8px 0 4px">${esc(r.titulo)}</h1>
  <p style="font-size:16px;color:#555;margin:0 0 20px">Hoje às <b>${hora(r.inicio)}</b>${cliente ? ` · ${esc(cliente)}` : ""}</p>
  ${whats ? `<p style="font-size:15px;margin:0 0 12px">Mande a confirmação no WhatsApp (a mensagem já vai pronta):</p>` : `<p style="font-size:15px;color:#888;margin:0 0 12px">Sem WhatsApp do cliente no cadastro.</p>`}
  <div>${whats ? botao(whats, "Abrir WhatsApp", "#128C7E") : ""}${link ? botao(link, "Entrar na chamada", "#1F1D2B") : ""}</div>
  ${whats ? `<p style="font-size:13px;color:#888;white-space:pre-wrap;border-left:3px solid #eee;padding-left:12px;margin:16px 0">${esc(mensagemWhats(r))}</p>` : ""}
  <p style="font-size:13px;margin-top:24px"><a href="${SITE_URL}/admin/agenda" style="color:#1F1D2B">Abrir a agenda</a></p>
</div>`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
