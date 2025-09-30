import StatCard from "@/components/StatCard";
import AttendanceChart from "@/components/AttendanceChart";
import HafalanChart from "@/components/HafalanChart";
import { Users, BookOpen, GraduationCap, UserCheck } from "lucide-react";

export default function Dashboard() {
  //todo: remove mock functionality
  const statsData = {
    totalSantri: 245,
    santriMutawassitoh: 145,
    santriAliyah: 100,
    totalMusammi: 35,
    musammiAliyah: 15,
    musammiJamii: 20,
  };

  const attendanceData = [
    { name: "Hari Ini", hadir: 180, sakit: 15, izin: 10, alpa: 5, terlambat: 8 }
  ];

  const hafalanData = [
    { bulan: "Jul", mutawassitoh: 2.5, aliyah: 3.8 },
    { bulan: "Agu", mutawassitoh: 3.2, aliyah: 4.5 },
    { bulan: "Sep", mutawassitoh: 3.8, aliyah: 5.2 },
    { bulan: "Okt", mutawassitoh: 4.1, aliyah: 5.8 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-welcome">Welcome to TAHFIDZ Software</h1>
        <p className="text-muted-foreground mt-2">
          Sistem manajemen halaqah Al-Qur'an untuk monitoring hafalan, absensi, dan perkembangan santri
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Santri"
          value={statsData.totalSantri}
          icon={Users}
          description="Semua Marhalah"
        />
        <StatCard
          title="Santri Mutawassitoh"
          value={statsData.santriMutawassitoh}
          icon={GraduationCap}
        />
        <StatCard
          title="Santri Aliyah"
          value={statsData.santriAliyah}
          icon={GraduationCap}
        />
        <StatCard
          title="Total Musammi"
          value={statsData.totalMusammi}
          icon={UserCheck}
          description={`${statsData.musammiAliyah} Aliyah, ${statsData.musammiJamii} Jamii`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart data={attendanceData} />
        <HafalanChart data={hafalanData} />
      </div>
    </div>
  );
}
