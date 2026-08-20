import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/70 px-5 py-5 shadow-[0_12px_38px_-28px_rgba(15,23,42,0.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700/80">Sunrise Dental</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
