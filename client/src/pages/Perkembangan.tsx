import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Perkembangan() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Perkembangan Santri</h1>
        <p className="text-muted-foreground mt-2">
          Pantau hafalan dan murojaah santri per bulan
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fitur Perkembangan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Halaman ini akan menampilkan data hafalan bulanan, murojaah bulanan, dan penambahan hafalan santri.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
