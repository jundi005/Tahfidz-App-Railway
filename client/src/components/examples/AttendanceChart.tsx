import AttendanceChart from "../AttendanceChart";

export default function AttendanceChartExample() {
  const mockData = [
    { name: "Hari Ini", hadir: 180, sakit: 15, izin: 10, alpa: 5, terlambat: 8 }
  ];

  return (
    <div className="p-6">
      <AttendanceChart data={mockData} />
    </div>
  );
}
