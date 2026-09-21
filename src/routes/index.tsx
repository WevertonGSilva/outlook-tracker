import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Download, Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { forecastData } from "@/lib/forecast-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Forecast da Recuperação Judicial" },
      { name: "description", content: "Acompanhamento mensal do forecast, realizado, Plano RJ e frota." },
      { property: "og:title", content: "Forecast da Recuperação Judicial" },
      { property: "og:description", content: "Painel executivo de acompanhamento do forecast e Plano RJ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForecastSheet,
});

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const compactMoney = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

function ForecastSheet() {
  const [year, setYear] = useState(2026);
  const [query, setQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(0);

  const yearIndexes = useMemo(
    () => forecastData.months.map((month, index) => ({ month, index })).filter(({ month }) => month.year === year),
    [year],
  );
  const filteredClients = forecastData.clients.filter((client) =>
    client.name.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")),
  );
  const activeIndex = yearIndexes[selectedMonth]?.index ?? yearIndexes[0]?.index ?? 0;
  const activeForecast = forecastData.forecast[activeIndex];
  const activeActual = forecastData.actual[activeIndex];
  const activePlan = forecastData.plan[activeIndex];
  const adherence = activeActual === null ? activeForecast / activePlan : activeActual / activeForecast;

  const changeYear = (nextYear: number) => {
    setYear(nextYear);
    setSelectedMonth(0);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface/80">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="chrome-mark grid size-10 shrink-0 place-items-center rounded-lg text-sm font-bold text-primary-foreground">RJ</div>
            <div>
              <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Recuperação judicial</p>
              <h1 className="text-lg font-bold leading-tight">Previsibilidade de faturamento</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="year-switch flex items-center border border-border bg-background">
              <Button variant="ghost" size="icon" aria-label="Ano anterior" disabled={year === 2026} onClick={() => changeYear(year - 1)}><ChevronLeft /></Button>
              <span className="min-w-16 text-center font-mono text-xs font-bold">{year}</span>
              <Button variant="ghost" size="icon" aria-label="Próximo ano" disabled={year === 2029} onClick={() => changeYear(year + 1)}><ChevronRight /></Button>
            </div>
            <span className="status-chip border border-border bg-background px-3 py-2 font-mono text-[10px] font-bold text-positive">● BASE DA PLANILHA</span>
            <Button variant="outline" size="icon" aria-label="Exportar visão" title="Exportar visão"><Download /></Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <section className="summary-grid grid border border-border bg-surface sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do mês">
          <Summary label={`Forecast · ${forecastData.months[activeIndex].label}`} value={compactMoney.format(activeForecast)} note={`${percent.format(activeForecast / activePlan)} do Plano RJ`} />
          <Summary label="Realizado" value={activeActual === null ? "—" : compactMoney.format(activeActual)} note={activeActual === null ? "Aguardando fechamento" : `${percent.format(activeActual / activeForecast)} do previsto`} tone={activeActual === null ? "muted" : activeActual >= activeForecast ? "positive" : "warning"} />
          <Summary label="Plano RJ" value={compactMoney.format(activePlan)} note={activeForecast >= activePlan ? "Forecast acima do plano" : "Forecast abaixo do plano"} tone={activeForecast >= activePlan ? "positive" : "warning"} />
          <Summary label="Frota projetada" value={String(forecastData.fleet[activeIndex])} note={`${percent.format(forecastData.ownedShare[activeIndex])} próprio`} />
        </section>

        <section className="mt-5 border border-border bg-surface" aria-labelledby="sheet-title">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="sheet-title" className="text-sm font-bold">Forecast versus realizado</h2>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">Valores mensais em reais · selecione um mês para o resumo</p>
            </div>
            <label className="flex h-9 items-center gap-2 border border-border bg-background px-3 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
              <Search className="size-3.5" />
              <span className="sr-only">Filtrar clientes</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar cliente" className="w-40 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground" />
            </label>
          </div>

          <div className="sheet-scroll overflow-x-auto">
            <table className="forecast-table w-full min-w-[900px] border-collapse font-mono text-[11px] tabular-nums">
              <thead>
                <tr>
                  <th rowSpan={2} className="sticky left-0 z-20 min-w-44 border-b border-r border-border bg-surface px-4 text-left font-display text-xs font-bold">CLIENTE</th>
                  {yearIndexes.map(({ month }, index) => (
                    <th key={month.key} colSpan={2} className={`month-heading border-b border-r border-border px-3 py-2 text-center ${selectedMonth === index ? "is-active" : ""}`}>
                      <button className="w-full uppercase" onClick={() => setSelectedMonth(index)}>{month.label}</button>
                    </th>
                  ))}
                </tr>
                <tr className="text-muted-foreground">
                  {yearIndexes.flatMap(({ month }, index) => [
                    <th key={`${month.key}-f`} className={`border-b border-r border-border px-3 py-2 text-right font-normal ${selectedMonth === index ? "active-column" : ""}`}>Previsto</th>,
                    <th key={`${month.key}-r`} className={`border-b border-r border-border px-3 py-2 text-right font-normal ${selectedMonth === index ? "active-column" : ""}`}>Realizado</th>,
                  ])}
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.name}>
                    <th className="sticky left-0 z-10 border-b border-r border-border bg-surface px-4 py-2.5 text-left font-display text-xs font-semibold">{client.name}</th>
                    {yearIndexes.flatMap(({ month, index }, monthIndex) => [
                      <td key={`${month.key}-f`} className={`border-b border-r border-border px-3 py-2.5 text-right ${selectedMonth === monthIndex ? "active-column" : ""}`}>{money.format(client.forecast[index])}</td>,
                      <td key={`${month.key}-r`} className={`border-b border-r border-border px-3 py-2.5 text-right ${selectedMonth === monthIndex ? "active-column" : ""}`}>{forecastData.actual[index] === null ? "—" : client.name === "NOVOS CLIENTES" ? "—" : money.format(index === 0 ? [361786.82,3953797,91545.6,185668.59,244648.21,550246.89,987004.09,33919.77,5331107.74,0][forecastData.clients.findIndex((item) => item.name === client.name)] : 0)}</td>,
                    ])}
                  </tr>
                ))}
                <TotalRow label="FORECAST" values={yearIndexes.map(({ index }) => forecastData.forecast[index])} selectedMonth={selectedMonth} />
                <TotalRow label="PLANO RJ" values={yearIndexes.map(({ index }) => forecastData.plan[index])} selectedMonth={selectedMonth} plan />
                <TotalRow label="REALIZADO" values={yearIndexes.map(({ index }) => forecastData.actual[index])} selectedMonth={selectedMonth} actual />
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 border border-border bg-surface">
          <div className="grid md:grid-cols-[1.25fr_1fr]">
            <div className="border-b border-border md:border-b-0 md:border-r">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3"><Filter className="size-3.5 text-primary" /><h2 className="text-sm font-bold">Capacidade operacional</h2></div>
              <div className="grid grid-cols-[1fr_auto] text-sm">
                <SheetLine label="Quantidade da frota" value={String(forecastData.fleet[activeIndex])} />
                <SheetLine label="Próprio" value={percent.format(forecastData.ownedShare[activeIndex])} tone="primary" />
                <SheetLine label="Subcontratado" value={percent.format(1 - forecastData.ownedShare[activeIndex])} tone="accent" />
              </div>
              <div className="fleet-track mx-4 mb-4 flex h-2 overflow-hidden bg-muted"><span className="chrome-fill" style={{ width: `${forecastData.ownedShare[activeIndex] * 100}%` }} /><span className="bg-accent" style={{ width: `${(1 - forecastData.ownedShare[activeIndex]) * 100}%` }} /></div>
            </div>
            <div>
              <div className="border-b border-border px-4 py-3"><h2 className="text-sm font-bold">Premissas</h2></div>
              {forecastData.assumptions.map((item) => (
                <div key={item.period} className="grid grid-cols-[72px_120px_1fr] border-b border-border text-xs last:border-b-0">
                  <span className="px-3 py-3 font-mono font-bold text-primary">{percent.format(item.rate)}</span>
                  <span className="border-x border-border px-3 py-3 font-mono text-muted-foreground">{item.period}</span>
                  <span className="px-3 py-3 leading-relaxed text-muted-foreground">{item.note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-1 py-5 font-mono text-[10px] text-muted-foreground sm:flex-row sm:justify-between">
          <span>Fonte: Forecast_versus_Realizado.xlsx</span><span>Período projetado: ago/2026 — ago/2029</span>
        </footer>
      </div>
    </main>
  );
}

function Summary({ label, value, note, tone = "default" }: { label: string; value: string; note: string; tone?: "default" | "positive" | "warning" | "muted" }) {
  return <div className="summary-cell border-b border-border p-4 sm:border-r xl:border-b-0"><p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p><p className={`mt-1 font-mono text-[10px] tone-${tone}`}>{note}</p></div>;
}

function TotalRow({ label, values, selectedMonth, plan, actual }: { label: string; values: readonly (number | null)[]; selectedMonth: number; plan?: boolean; actual?: boolean }) {
  return <tr className={plan ? "total-row plan-row" : actual ? "total-row actual-row" : "total-row"}><th className="sticky left-0 z-10 border-b border-r border-border px-4 py-2.5 text-left font-display text-xs font-bold">{label}</th>{values.flatMap((value, index) => [<td key={`${label}-${index}-f`} colSpan={actual ? 2 : 1} className={`border-b border-r border-border px-3 py-2.5 text-right font-bold ${selectedMonth === index ? "active-column" : ""}`}>{value === null ? "—" : money.format(value)}</td>, ...(!actual ? [<td key={`${label}-${index}-blank`} className={`border-b border-r border-border px-3 py-2.5 text-right ${selectedMonth === index ? "active-column" : ""}`}>{plan ? "meta" : "—"}</td>] : [])])}</tr>;
}

function SheetLine({ label, value, tone }: { label: string; value: string; tone?: "primary" | "accent" }) {
  return <><span className="border-b border-border px-4 py-3 text-muted-foreground">{label}</span><strong className={`border-b border-l border-border px-4 py-3 font-mono ${tone === "primary" ? "text-primary" : tone === "accent" ? "text-accent-foreground" : ""}`}>{value}</strong></>;
}