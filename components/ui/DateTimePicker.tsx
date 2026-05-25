"use client";

import { useState, useRef, useEffect } from "react";

const MONTHS: Record<string, string[]> = {
  es: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
};

const WEEKDAYS: Record<string, string[]> = {
  es: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

interface DateTimePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  locale?: "es" | "en";
  minDate?: Date;
  placeholder?: string;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns 0=Monday … 6=Sunday offset for the first day of the month. */
function firstDayOffset(year: number, month: number) {
  const d = new Date(year, month, 1).getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDisplay(date: Date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}  ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  locale = "es",
  minDate,
  placeholder = "dd/mm/aaaa hh:mm",
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(value?.getDate() ?? null);
  const [hour, setHour] = useState(value?.getHours() ?? 9);
  const [minute, setMinute] = useState(value?.getMinutes() ?? 0);
  const ref = useRef<HTMLDivElement>(null);

  const months = MONTHS[locale] ?? MONTHS.es;
  const weekdays = WEEKDAYS[locale] ?? WEEKDAYS.es;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function isDisabled(day: number) {
    if (!minDate) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  }

  function confirm() {
    if (selectedDay === null) return;
    const d = new Date(viewYear, viewMonth, selectedDay, hour, minute, 0, 0);
    onChange(d);
    setOpen(false);
  }

  function clear() {
    setSelectedDay(null);
    onChange(null);
    setOpen(false);
  }

  const totalDays = daysInMonth(viewYear, viewMonth);
  const offset = firstDayOffset(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const displayValue = value ? formatDisplay(value) : "";

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-left text-sm"
        style={{
          background: "var(--bone)",
          borderColor: "var(--line)",
          color: displayValue ? "var(--ink)" : "rgba(43,39,36,.45)",
        }}
      >
        <span>{displayValue || placeholder}</span>
        <svg className="w-4 h-4 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 left-0 rounded-xl shadow-xl border p-4 w-72"
          style={{ background: "var(--bone)", borderColor: "var(--line)" }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-(--bone-2) transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-display text-sm font-medium" style={{ color: "var(--green)" }}>
              {months[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-(--bone-2) transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekdays.map(d => (
              <div key={d} className="text-center text-xs font-medium py-1" style={{ color: "var(--terra)" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const disabled = isDisabled(day);
              const selected = day === selectedDay;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedDay(day)}
                  className="aspect-square flex items-center justify-center rounded-lg text-sm transition-colors"
                  style={{
                    background: selected ? "var(--green)" : "transparent",
                    color: disabled ? "rgba(43,39,36,.3)" : selected ? "var(--bone)" : "var(--ink)",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={e => {
                    if (!selected && !disabled)
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--bone-2)";
                  }}
                  onMouseLeave={e => {
                    if (!selected)
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time picker */}
          <div className="mt-3 flex items-center gap-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: "var(--terra)" }}>
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 7v5l3 3" />
            </svg>
            <input
              type="number"
              min={0} max={23}
              value={pad(hour)}
              onChange={e => setHour(Math.min(23, Math.max(0, Number(e.target.value))))}
              className="w-12 text-center rounded border px-1 py-1 text-sm"
              style={{ borderColor: "var(--line)", background: "var(--bone)", color: "var(--ink)" }}
            />
            <span className="font-display text-lg" style={{ color: "var(--green)" }}>:</span>
            <input
              type="number"
              min={0} max={59} step={5}
              value={pad(minute)}
              onChange={e => setMinute(Math.min(59, Math.max(0, Number(e.target.value))))}
              className="w-12 text-center rounded border px-1 py-1 text-sm"
              style={{ borderColor: "var(--line)", background: "var(--bone)", color: "var(--ink)" }}
            />
          </div>

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={clear}
              className="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{ borderColor: "var(--line)", color: "var(--ink)", background: "transparent" }}
            >
              {locale === "es" ? "Limpiar" : "Clear"}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={selectedDay === null}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: selectedDay !== null ? "var(--green)" : "var(--line)",
                color: selectedDay !== null ? "var(--bone)" : "rgba(43,39,36,.4)",
                cursor: selectedDay !== null ? "pointer" : "not-allowed",
              }}
            >
              {locale === "es" ? "Confirmar" : "Confirm"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
