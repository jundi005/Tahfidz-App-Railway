import HalaqahTable from "../HalaqahTable";

export default function HalaqahTableExample() {
  const mockData = [
    {
      id: "1",
      namaSantri: "Ahmad Zaki",
      kelas: "1A",
      marhalah: "Mutawassitoh",
      nomorHalaqah: 1,
      namaMusammi: "Ustadz Hamdan",
      marhalahMusammi: "Jamii",
      kelasMusammi: "TQS",
      jumlahHafalan: 5.5
    },
    {
      id: "2",
      namaSantri: "Fatimah Azzahra",
      kelas: "2B",
      marhalah: "Aliyah",
      nomorHalaqah: 3,
      namaMusammi: "Ustadzah Maryam",
      marhalahMusammi: "Jamii",
      kelasMusammi: "KHS",
      jumlahHafalan: 12.3
    }
  ];

  return (
    <div className="p-6">
      <HalaqahTable 
        data={mockData}
        onEdit={(id) => console.log("Edit:", id)}
        onDelete={(id) => console.log("Delete:", id)}
      />
    </div>
  );
}
