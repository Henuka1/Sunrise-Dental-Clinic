import Spinner from "@/components/ui/Spinner";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableLoading() {
  return (
    <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
      <Spinner size="lg" />
    </div>
  );
}
