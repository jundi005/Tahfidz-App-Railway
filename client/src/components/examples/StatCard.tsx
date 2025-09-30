import StatCard from "../StatCard";
import { Users } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <StatCard
        title="Total Santri"
        value={245}
        icon={Users}
        description="Mutawassitoh & Aliyah"
      />
      <StatCard
        title="Total Musammi"
        value={35}
        icon={Users}
        description="Semua Marhalah"
      />
    </div>
  );
}
