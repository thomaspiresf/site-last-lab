// Convite da reunião em .ics (Google, Outlook, iPhone). Usado no link do e-mail da Last Lab
// (função convite-ics) para o cliente adicionar a reunião na agenda dele.

export const TITULO_CLIENTE = "Conversa com a Last Lab";
export const zulu = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escI = (t: string) => String(t ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** O mesmo UID do evento no Google (eventId@google.com): a agenda do cliente não duplica. */
// deno-lint-ignore no-explicit-any
export const uidReuniao = (r: any) => (r.google_event_id ? `${r.google_event_id}@google.com` : `${r.id}@lastlab.com.br`);

// deno-lint-ignore no-explicit-any
export function ics(r: any, cancelada = false) {
  const ini = new Date(r.inicio);
  const fim = new Date(ini.getTime() + r.duracao_min * 60000);
  const link = /^https?:\/\//.test(r.local || "") ? r.local : "";
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Last Lab//Agenda//PT", "CALSCALE:GREGORIAN",
    `METHOD:${cancelada ? "CANCEL" : "PUBLISH"}`,
    "BEGIN:VEVENT",
    `UID:${uidReuniao(r)}`, `SEQUENCE:${r.convite_seq || 0}`, `DTSTAMP:${zulu(new Date())}`,
    `DTSTART:${zulu(ini)}`, `DTEND:${zulu(fim)}`,
    `SUMMARY:${escI(TITULO_CLIENTE)}`,
    `DESCRIPTION:${escI(link ? `Link da chamada: ${link}` : "Last Lab · lastlab.com.br")}`,
    link ? `LOCATION:${escI(link)}` : "", link ? `URL:${link}` : "",
    "ORGANIZER;CN=Last Lab:mailto:contato@lastlab.com.br",
    `STATUS:${cancelada ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}
