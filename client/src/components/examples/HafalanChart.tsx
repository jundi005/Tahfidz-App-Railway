import HafalanChart from "../HafalanChart";

export default function HafalanChartExample() {
  const mockData = [
    { bulan: "Jul", mutawassitoh: 2.5, aliyah: 3.8 },
    { bulan: "Agu", mutawassitoh: 3.2, aliyah: 4.5 },
    { bulan: "Sep", mutawassitoh: 3.8, aliyah: 5.2 },
    { bulan: "Okt", mutawassitoh: 4.1, aliyah: 5.8 }
  ];

  return (
    <div className="p-6">
      <HafalanChart data={mockData} />
    </div>
  );
}
