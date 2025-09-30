import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

interface Person {
  id: string;
  nama: string;
  kelas: string;
  status: string;
}

interface AbsensiGroupProps {
  halaqahNo: number;
  musammi: Person;
  santri: Person[];
  onStatusChange: (personId: string, status: string, type: 'musammi' | 'santri') => void;
}

export default function AbsensiGroup({ halaqahNo, musammi, santri, onStatusChange }: AbsensiGroupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Halaqah {halaqahNo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-b pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">{musammi.nama}</p>
              <p className="text-sm text-muted-foreground">Musammi - {musammi.kelas}</p>
            </div>
            <Badge variant="outline">Pengampu</Badge>
          </div>
          <RadioGroup
            value={musammi.status}
            onValueChange={(value) => onStatusChange(musammi.id, value, 'musammi')}
            className="flex gap-3"
            data-testid={`radio-musammi-${musammi.id}`}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="HADIR" id={`${musammi.id}-hadir`} />
              <Label htmlFor={`${musammi.id}-hadir`} className="cursor-pointer">Hadir</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="SAKIT" id={`${musammi.id}-sakit`} />
              <Label htmlFor={`${musammi.id}-sakit`} className="cursor-pointer">Sakit</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="IZIN" id={`${musammi.id}-izin`} />
              <Label htmlFor={`${musammi.id}-izin`} className="cursor-pointer">Izin</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ALPA" id={`${musammi.id}-alpa`} />
              <Label htmlFor={`${musammi.id}-alpa`} className="cursor-pointer">Alpa</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="TERLAMBAT" id={`${musammi.id}-terlambat`} />
              <Label htmlFor={`${musammi.id}-terlambat`} className="cursor-pointer">Terlambat</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Santri ({santri.length})</p>
          {santri.map((s) => (
            <div key={s.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{s.nama}</p>
                  <p className="text-xs text-muted-foreground">{s.kelas}</p>
                </div>
              </div>
              <RadioGroup
                value={s.status}
                onValueChange={(value) => onStatusChange(s.id, value, 'santri')}
                className="flex gap-3"
                data-testid={`radio-santri-${s.id}`}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="HADIR" id={`${s.id}-hadir`} />
                  <Label htmlFor={`${s.id}-hadir`} className="cursor-pointer">Hadir</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SAKIT" id={`${s.id}-sakit`} />
                  <Label htmlFor={`${s.id}-sakit`} className="cursor-pointer">Sakit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="IZIN" id={`${s.id}-izin`} />
                  <Label htmlFor={`${s.id}-izin`} className="cursor-pointer">Izin</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ALPA" id={`${s.id}-alpa`} />
                  <Label htmlFor={`${s.id}-alpa`} className="cursor-pointer">Alpa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="TERLAMBAT" id={`${s.id}-terlambat`} />
                  <Label htmlFor={`${s.id}-terlambat`} className="cursor-pointer">Terlambat</Label>
                </div>
              </RadioGroup>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
