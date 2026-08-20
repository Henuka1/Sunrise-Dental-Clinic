import { CalendarPlus, Calendar, Search, DollarSign, FileBarChart, HelpCircle, Phone, Mail, MapPin } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { CLINIC_INFO } from "@/lib/constants";

const helpTopics = [
  {
    icon: CalendarPlus,
    title: "Creating a New Appointment",
    steps: [
      "Go to 'New Appointment' from the navigation menu.",
      "Search for an existing patient by name or NIC.",
      "If patient is not listed, open 'Register New Patient' and complete the dedicated registration page.",
      "After saving the patient, you will be redirected back to New Appointment automatically.",
      "Select the dentist, treatment type, date, and time for the appointment.",
      "Add any optional notes and click 'Create Appointment'.",
    ],
  },
  {
    icon: Calendar,
    title: "Managing Appointments",
    steps: [
      "Go to 'Appointments' to see all appointments.",
      "Use the date and status filters to narrow down the list.",
      "Click the checkmark icon to mark an appointment as completed.",
      "Click the X icon to cancel an appointment — you'll be asked to confirm.",
    ],
  },
  {
    icon: Search,
    title: "Searching for Appointments",
    steps: [
      "Go to 'Search' from the navigation menu.",
      "Enter the patient's name or NIC number in the search field.",
      "Press Enter or click the Search button.",
      "Matching appointments will be displayed as cards with full details.",
    ],
  },
  {
    icon: DollarSign,
    title: "Billing and Payments",
    steps: [
      "Go to 'Billing' to view all bills.",
      "Filter bills by payment status (Paid, Pending, Partial).",
      "The summary cards show total revenue and pending amounts.",
      "Click 'Mark Paid' on any unpaid bill to update its payment status.",
    ],
  },
  {
    icon: FileBarChart,
    title: "Generating Reports",
    steps: [
      "Go to 'Reports' and choose a report type: Daily, Revenue, or Dentist.",
      "For Daily Reports: select a date and click Generate.",
      "For Revenue Reports: select a date range and click Generate.",
      "For Dentist Reports: select a dentist and date range, then click Generate.",
    ],
  },
];

export default function HelpPage() {
  return (
    <div>
      <PageHeader
        title="Help & Support"
        description="Learn how to use the Sunrise Dental Clinic Management System"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {helpTopics.map((topic) => (
            <Card key={topic.title}>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                  <topic.icon className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{topic.title}</h3>
                  <ol className="mt-3 space-y-2">
                    {topic.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-600">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Contact Support" />
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-teal-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Phone</p>
                  <p className="text-sm text-slate-500">{CLINIC_INFO.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-teal-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Email</p>
                  <p className="text-sm text-slate-500">{CLINIC_INFO.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-teal-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Address</p>
                  <p className="text-sm text-slate-500">{CLINIC_INFO.address}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-teal-50 border-teal-200">
            <div className="flex items-start gap-3">
              <HelpCircle className="mt-0.5 h-5 w-5 text-teal-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Need more help?</p>
                <p className="mt-1 text-sm text-slate-600">
                  If you encounter any issues or have questions, please contact
                  the system administrator at {CLINIC_INFO.email}.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
