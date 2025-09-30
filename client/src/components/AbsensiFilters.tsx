import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AbsensiFiltersProps {
  marhalah: string;
  waktu: string;
  tanggal: string;
  onMarhalahChange: (value: string) => void;
  onWaktuChange: (value: string) => void;
  onTanggalChange: (value: string) => void;
}

export default function AbsensiFilters({
  marhalah,
  waktu,
  tanggal,
  onMarhalahChange,
  onWaktuChange,
  onTanggalChange,
}: AbsensiFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="marhalah">Marhalah</Label>
        <Select value={marhalah} onValueChange={onMarhalahChange}>
          <SelectTrigger id="marhalah" data-testid="select-marhalah">
            <SelectValue placeholder="Pilih Marhalah" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MUT">Mutawassitoh</SelectItem>
            <SelectItem value="ALI">Aliyah</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="waktu">Waktu</Label>
        <Select value={waktu} onValueChange={onWaktuChange}>
          <SelectTrigger id="waktu" data-testid="select-waktu">
            <SelectValue placeholder="Pilih Waktu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SUBUH">Shubuh</SelectItem>
            <SelectItem value="ASHAR">Ashar</SelectItem>
            <SelectItem value="ISYA">Isya</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tanggal">Tanggal</Label>
        <Input
          id="tanggal"
          type="date"
          value={tanggal}
          onChange={(e) => onTanggalChange(e.target.value)}
          data-testid="input-tanggal"
        />
      </div>
    </div>
  );
}
