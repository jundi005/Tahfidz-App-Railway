import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/StatCard";
import AttendanceChart from "@/components/AttendanceChart";
import HafalanChart from "@/components/HafalanChart";
import { Users, GraduationCap, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DashboardStats } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-96" />
          <Skeleton className="h-5 w-full max-w-2xl mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive font-semibold">Gagal memuat data dashboard</p>
        <p className="text-muted-foreground text-sm mt-2">
          {error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data'}
        </p>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-muted-foreground py-8">Data tidak tersedia</div>;
  }

  const attendanceData = stats.absensi7Hari && stats.absensi7Hari.length > 0
    ? stats.absensi7Hari.map(day => {
        const date = new Date(day.tanggal);
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
        return {
          name: dayName,
          hadir: day.hadir,
          sakit: day.sakit,
          izin: day.izin,
          alpa: day.alpa,
          terlambat: day.terlambat
        };
      })
    : [{
        name: "Hari Ini",
        hadir: stats.absensiHariIni.hadir,
        sakit: stats.absensiHariIni.sakit,
        izin: stats.absensiHariIni.izin,
        alpa: stats.absensiHariIni.alpa,
        terlambat: stats.absensiHariIni.terlambat
      }];

  const hafalanData = stats.hafalanBulanIni.map(h => ({
    bulan: h.bulan,
    mutawassitoh: h.rataMutawassitoh,
    aliyah: h.rataAliyah
  }));

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
          value={stats.totalSantri}
          icon={Users}
          description="Semua Marhalah"
          data-testid="stat-total-santri"
        />
        <StatCard
          title="Santri Mutawassitoh"
          value={stats.santriMutawassitoh}
          icon={GraduationCap}
          data-testid="stat-santri-mut"
        />
        <StatCard
          title="Santri Aliyah"
          value={stats.santriAliyah}
          icon={GraduationCap}
          data-testid="stat-santri-aliyah"
        />
        <StatCard
          title="Total Musammi"
          value={stats.totalMusammi}
          icon={UserCheck}
          description={`${stats.musammiHalaqahAliyah} Aliyah, ${stats.musammiHalaqahMutawassitoh} Mutawassitoh`}
          data-testid="stat-total-musammi"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart data={attendanceData} />
        <HafalanChart data={hafalanData} />
      </div>
    </div>
  );
}
