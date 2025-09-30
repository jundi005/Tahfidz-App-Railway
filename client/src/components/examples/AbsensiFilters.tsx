import AbsensiFilters from "../AbsensiFilters";
import { useState } from "react";

export default function AbsensiFiltersExample() {
  const [marhalah, setMarhalah] = useState("MUT");
  const [waktu, setWaktu] = useState("SUBUH");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="p-6">
      <AbsensiFilters
        marhalah={marhalah}
        waktu={waktu}
        tanggal={tanggal}
        onMarhalahChange={setMarhalah}
        onWaktuChange={setWaktu}
        onTanggalChange={setTanggal}
      />
    </div>
  );
}
