import { BadgeCheck, Clock, Ticket, XCircle } from "lucide-react";
import { VERIFIED_STATUS } from "../../lib/api/index.js";
import { PaymentStatCard, StatusCard, SubscriptionPie } from "./components/index.js";

// One card per backend filter bucket. "rejected" is a single bucket covering
// both Ditolak display states (Registrasi Ulang + Permanen).
const DASHBOARD_CARDS = [
  {
    filter: VERIFIED_STATUS.WAITING,
    status: 0,
    Icon: Clock,
    cardClass: "bg-gradient-to-br from-pink-500 to-pink-600",
  },
  {
    filter: VERIFIED_STATUS.PENDING_VOUCHER,
    status: 3,
    Icon: Ticket,
    cardClass: "bg-gradient-to-br from-orange-500 to-orange-600",
  },
  {
    filter: VERIFIED_STATUS.APPROVED,
    status: 1,
    Icon: BadgeCheck,
    cardClass: "bg-gradient-to-br from-green-500 to-green-600",
  },
  {
    filter: VERIFIED_STATUS.REJECTED,
    title: "Ditolak",
    Icon: XCircle,
    cardClass: "bg-gradient-to-br from-red-500 to-red-600",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Users</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DASHBOARD_CARDS.map((card) => (
            <StatusCard key={card.filter} {...card} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Subscription</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <SubscriptionPie />
          </div>
          <div>
            <PaymentStatCard />
          </div>
        </div>
      </section>
    </div>
  );
}
