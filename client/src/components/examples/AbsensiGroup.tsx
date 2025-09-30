import AbsensiGroup from "../AbsensiGroup";
import { useState } from "react";

export default function AbsensiGroupExample() {
  const [musammi, setMusammi] = useState({
    id: "m1",
    nama: "Ustadz Ahmad",
    kelas: "TQS",
    status: "HADIR"
  });

  const [santri, setSantri] = useState([
    { id: "s1", nama: "Ali Rahman", kelas: "1A", status: "HADIR" },
    { id: "s2", nama: "Fatimah Sari", kelas: "1A", status: "HADIR" }
  ]);

  const handleStatusChange = (personId: string, status: string, type: 'musammi' | 'santri') => {
    if (type === 'musammi') {
      setMusammi({ ...musammi, status });
    } else {
      setSantri(santri.map(s => s.id === personId ? { ...s, status } : s));
    }
    console.log(`${type} ${personId} status: ${status}`);
  };

  return (
    <div className="p-6">
      <AbsensiGroup
        halaqahNo={1}
        musammi={musammi}
        santri={santri}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
