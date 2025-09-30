import HalaqahTable from "@/components/HalaqahTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DataHalaqah() {
  //todo: remove mock functionality
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
    },
    {
      id: "3",
      namaSantri: "Muhammad Rizki",
      kelas: "1B",
      marhalah: "Mutawassitoh",
      nomorHalaqah: 2,
      namaMusammi: "Ustadz Abdullah",
      marhalahMusammi: "Jamii",
      kelasMusammi: "KS",
      jumlahHafalan: 4.2
    },
    {
      id: "4",
      namaSantri: "Siti Aisyah",
      kelas: "3A",
      marhalah: "Aliyah",
      nomorHalaqah: 5,
      namaMusammi: "Ustadzah Khadijah",
      marhalahMusammi: "Jamii",
      kelasMusammi: "TQS",
      jumlahHafalan: 18.7
    }
  ];

  const handleEdit = (id: string) => {
    console.log("Edit halaqah:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete halaqah:", id);
  };

  const handleAdd = () => {
    console.log("Add new halaqah");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Halaqah</h1>
          <p className="text-muted-foreground mt-2">
            Kelola data santri, musammi, dan keanggotaan halaqah
          </p>
        </div>
        <Button onClick={handleAdd} data-testid="button-add-halaqah">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Data
        </Button>
      </div>

      <HalaqahTable
        data={mockData}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
