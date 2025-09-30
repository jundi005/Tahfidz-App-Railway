import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Kalender() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kalender & Tugas</h1>
        <p className="text-muted-foreground mt-2">
          Kelola jadwal dan tugas untuk admin dan musammi
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fitur Kalender & Tugas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Halaman ini akan menampilkan kalender dan daftar tugas yang dapat dikelola.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
