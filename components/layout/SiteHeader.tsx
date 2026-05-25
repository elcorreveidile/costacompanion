import { LogoSymbol } from "@/components/icons/LogoSymbol";

export function SiteHeader() {
  return (
    <header className="w-full bg-(--green) py-4 px-6">
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        <LogoSymbol
          strokeColor="#F7F4EF"
          dotColor="#E0A877"
          className="h-9 w-9 shrink-0"
        />
        <span
          className="font-display text-xl font-medium tracking-tight"
          style={{ color: "var(--bone)" }}
        >
          Costa Companion
        </span>
      </div>
    </header>
  );
}
