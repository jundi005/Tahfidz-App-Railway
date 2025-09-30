import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Search } from "lucide-react";
import { useState } from "react";

interface HalaqahData {
  id: string;
  namaSantri: string;
  kelas: string;
  marhalah: string;
  nomorHalaqah: number;
  namaMusammi: string;
  marhalahMusammi: string;
  kelasMusammi: string;
  jumlahHafalan: number;
}

interface HalaqahTableProps {
  data: HalaqahData[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function HalaqahTable({ data, onEdit, onDelete }: HalaqahTableProps) {
  const [search, setSearch] = useState("");

  const filteredData = data.filter((item) =>
    item.namaSantri.toLowerCase().includes(search.toLowerCase()) ||
    item.namaMusammi.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle>Data Halaqah</CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari santri atau musammi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-halaqah"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-card">Nama Santri</TableHead>
                <TableHead className="sticky top-0 bg-card">Kelas</TableHead>
                <TableHead className="sticky top-0 bg-card">Marhalah</TableHead>
                <TableHead className="sticky top-0 bg-card">No. Halaqah</TableHead>
                <TableHead className="sticky top-0 bg-card">Nama Musammi</TableHead>
                <TableHead className="sticky top-0 bg-card">Marhalah Musammi</TableHead>
                <TableHead className="sticky top-0 bg-card">Kelas Musammi</TableHead>
                <TableHead className="sticky top-0 bg-card">Hafalan (Juz)</TableHead>
                <TableHead className="sticky top-0 bg-card text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id} className="hover-elevate" data-testid={`row-halaqah-${item.id}`}>
                  <TableCell className="font-medium">{item.namaSantri}</TableCell>
                  <TableCell>{item.kelas}</TableCell>
                  <TableCell>{item.marhalah}</TableCell>
                  <TableCell className="font-mono">{item.nomorHalaqah}</TableCell>
                  <TableCell>{item.namaMusammi}</TableCell>
                  <TableCell>{item.marhalahMusammi}</TableCell>
                  <TableCell>{item.kelasMusammi}</TableCell>
                  <TableCell className="font-mono">{item.jumlahHafalan}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(item.id)}
                        data-testid={`button-edit-${item.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete?.(item.id)}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
