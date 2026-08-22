import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { appointmentService } from "@/lib/services";
import { formatDate, formatTime, getErrorMessage } from "@/lib/utils";
import type { Appointment } from "@/types";

export default function SearchPage() {
  const { user } = useAuth();
  const isDentist = user?.role === "DENTIST";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setError("");
    try {
      const res = await appointmentService.searchByNicOrName(query.trim());
      setResults(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Search Appointments"
        description="Find appointments by patient name or NIC number"
      />

      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Enter patient name or NIC..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" loading={loading}>
            <Search className="h-4 w-4" />
            Search
          </Button>
        </form>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="Search failed"
          description={error}
        />
      ) : searched && results.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="No results found"
          description={`No appointments matched "${query}". Try a different search term.`}
        />
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {results.length} appointment{results.length > 1 ? "s" : ""} found
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((apt) => (
              <Card key={apt.appointmentId}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-teal-700">{apt.appointmentNumber}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{apt.patientName}</p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dentist</span>
                    <span className="text-slate-900">Dr. {apt.dentistName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Treatment</span>
                    <span className="text-slate-900">{apt.treatmentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date</span>
                    <span className="text-slate-900">{formatDate(apt.appointmentDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time</span>
                    <span className="text-slate-900">{formatTime(apt.appointmentTime)}</span>
                  </div>
                </div>
                {!isDentist && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <Link
                      to="/billing"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View Bill
                    </Link>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="Search for appointments"
          description="Enter a patient name or NIC number above to find their appointments."
        />
      )}
    </div>
  );
}
