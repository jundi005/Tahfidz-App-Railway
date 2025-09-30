import { useState } from "react";
import AbsensiFilters from "@/components/AbsensiFilters";
import AbsensiGroup from "@/components/AbsensiGroup";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Absensi() {
  const { toast } = useToast();
  const [marhalah, setMarhalah] = useState("MUT");
  const [waktu, setWaktu] = useState("SUBUH");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  //todo: remove mock functionality
  const [halaqahData, setHalaqahData] = useState([
    {
      halaqahNo: 1,
      musammi: { id: "m1", nama: "Ustadz Ahmad", kelas: "TQS", status: "HADIR" },
      santri: [
        { id: "s1", nama: "Ali Rahman", kelas: "1A", status: "HADIR" },
        { id: "s2", nama: "Fatimah Sari", kelas: "1A", status: "HADIR" },
        { id: "s3", nama: "Zainab Husna", kelas: "1A", status: "HADIR" }
      ]
    },
    {
      halaqahNo: 2,
      musammi: { id: "m2", nama: "Ustadzah Maryam", kelas: "KHS", status: "HADIR" },
      santri: [
        { id: "s4", nama: "Ibrahim Khalil", kelas: "1B", status: "HADIR" },
        { id: "s5", nama: "Khadijah Aminah", kelas: "1B", status: "HADIR" }
      ]
    }
  ]);

  const handleStatusChange = (halaqahNo: number, personId: string, status: string, type: 'musammi' | 'santri') => {
    setHalaqahData(prev => prev.map(h => {
      if (h.halaqahNo === halaqahNo) {
        if (type === 'musammi') {
          return { ...h, musammi: { ...h.musammi, status } };
        } else {
          return {
            ...h,
            santri: h.santri.map(s => s.id === personId ? { ...s, status } : s)
          };
        }
      }
      return h;
    }));
  };

  const handleSubmit = () => {
    console.log("Submit absensi:", { marhalah, waktu, tanggal, data: halaqahData });
    toast({
      title: "Absensi Berhasil Disimpan",
      description: `Data absensi untuk ${marhalah === 'MUT' ? 'Mutawassitoh' : 'Aliyah'} - ${waktu === 'SUBUH' ? 'Shubuh' : waktu === 'ASHAR' ? 'Ashar' : 'Isya'} telah disimpan`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Absensi Halaqah</h1>
        <p className="text-muted-foreground mt-2">
          Catat kehadiran musammi dan santri untuk setiap halaqah
        </p>
      </div>

      <AbsensiFilters
        marhalah={marhalah}
        waktu={waktu}
        tanggal={tanggal}
        onMarhalahChange={setMarhalah}
        onWaktuChange={setWaktu}
        onTanggalChange={setTanggal}
      />

      <div className="space-y-4">
        {halaqahData.map((h) => (
          <AbsensiGroup
            key={h.halaqahNo}
            halaqahNo={h.halaqahNo}
            musammi={h.musammi}
            santri={h.santri}
            onStatusChange={(personId, status, type) => 
              handleStatusChange(h.halaqahNo, personId, status, type)
            }
          />
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} size="lg" data-testid="button-submit-absensi">
          Submit Absensi
        </Button>
      </div>
    </div>
  );
}
