"use client";

export default function InsightLayout({
  title,
  description,
  tabs = [],
  activeTab,
  onTabChange,
  heroContent,
  headerAction,
  children,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-indigo-50 text-slate-700">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.3),_transparent_65%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(165,243,252,0.35),_transparent_70%)]" />
      <div className="relative flex min-h-screen items-start justify-center">
        <div className="w-full max-w-7xl px-4 py-12 md:px-10">
          <div className="flex flex-col gap-10">
            <div className="relative overflow-hidden rounded-3xl border border-sky-200/60 bg-white/70 p-6 shadow-[0_0_48px_rgba(96,165,250,0.25)] backdrop-blur">
              <div className="pointer-events-none absolute -top-10 left-8 h-32 w-32 rounded-full bg-sky-200/50 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-14 right-10 h-36 w-36 rounded-full bg-indigo-200/50 blur-3xl" />
              <div className="relative flex flex-col gap-6">
                <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-sky-700">{title}</h1>
                    {description ? (
                      <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>
                    ) : null}
                  </div>
                  {tabs.length || headerAction ? (
                    <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-start md:justify-end md:gap-4">
                      {tabs.length ? (
                        <div className="flex flex-wrap justify-start gap-2 rounded-2xl border border-sky-100/80 bg-white/70 p-2 shadow-inner md:justify-end">
                          {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = tab.value === activeTab;
                            return (
                              <button
                                key={tab.value}
                                onClick={() => onTabChange?.(tab.value)}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
                                  isActive
                                    ? "bg-sky-100 text-sky-800 shadow-[0_8px_20px_rgba(96,165,250,0.25)]"
                                    : "text-slate-600 hover:bg-sky-50"
                                }`}
                                type="button"
                              >
                                {Icon ? <Icon className="h-4 w-4" /> : null}
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                      {headerAction ? (
                        <div className="flex justify-end md:self-start">{headerAction}</div>
                      ) : null}
                    </div>
                  ) : null}
                </header>

                {heroContent}
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
