import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Trash2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { 
  Halaqah, 
  Musammi, 
  Santri, 
  LookupsResponse,
  InsertSantri,
  InsertHalaqah,
  InsertHalaqahMembers
} from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface HalaqahRow {
  id: string;
  namaSantri: string;
  kelas: string;
  marhalahId: string;
  nomorUrutHalaqah: number;
  namaMusammi: string;
  marhalahMusammi: string;
  kelasMusammi: string;
  jumlahHafalan: number;
}

export default function DataHalaqah() {
  const { toast } = useToast();
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [rows, setRows] = useState<HalaqahRow[]>([{
    id: crypto.randomUUID(),
    namaSantri: '',
    kelas: '',
    marhalahId: 'MUT',
    nomorUrutHalaqah: 1,
    namaMusammi: '',
    marhalahMusammi: 'JAM',
    kelasMusammi: '',
    jumlahHafalan: 0
  }]);

  // Fetch lookups
  const { data: lookups, isLoading: loadingLookups, isError: errorLookups } = useQuery<LookupsResponse>({
    queryKey: ['/api/lookups'],
  });

  const { data: allHalaqah, isLoading: loadingHalaqah } = useQuery<Halaqah[]>({
    queryKey: ['/api/halaqah'],
  });

  const { data: allMusammi, isLoading: loadingMusammi, isError: errorMusammi } = useQuery<Musammi[]>({
    queryKey: ['/api/musammi'],
  });

  const { data: allSantri, isLoading: loadingSantri, isError: errorSantri } = useQuery<Santri[]>({
    queryKey: ['/api/santri'],
  });

  // Check if all required data is loaded
  const isDataReady = lookups && allSantri && allMusammi && allHalaqah && 
    !loadingHalaqah && !loadingSantri && !loadingMusammi && !loadingLookups;
  
  const hasDataError = errorSantri || errorMusammi || errorLookups;

  // Mutation untuk batch create
  const bulkCreateMutation = useMutation({
    mutationFn: async (data: HalaqahRow[]) => {
      const bulan = new Date().toISOString().slice(0, 7);
      
      // In-batch cache untuk menghindari duplikasi
      const santriCache = new Map<string, string>(); // key: nama+marhalah+kelas, value: santriId
      const musammiCache = new Map<string, string>(); // key: nama+marhalah+kelas, value: musammiId
      const halaqahCache = new Map<string, string>(); // key: nomor+marhalah+musammiId, value: halaqahId
      
      const results: { row: number; success: boolean; error?: string }[] = [];
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          // Normalize inputs
          const namaSantri = row.namaSantri.trim();
          const kelas = row.kelas.trim();
          const namaMusammi = row.namaMusammi.trim();
          const kelasMusammi = row.kelasMusammi.trim();
          
          // Validate
          if (row.nomorUrutHalaqah < 1) {
            throw new Error('Nomor urut halaqah harus >= 1');
          }
          
          // 1. Create or get Santri
          let santriId = '';
          const santriKey = `${namaSantri.toLowerCase()}|${row.marhalahId}|${kelas}`;
          
          if (santriCache.has(santriKey)) {
            santriId = santriCache.get(santriKey)!;
          } else {
            const existingSantri = allSantri?.find(s => 
              s.NamaSantri.toLowerCase().trim() === namaSantri.toLowerCase() &&
              s.MarhalahID === row.marhalahId &&
              s.Kelas.trim() === kelas
            );

            if (existingSantri) {
              santriId = existingSantri.SantriID;
              santriCache.set(santriKey, santriId);
            } else {
              const santriData: InsertSantri = {
                NamaSantri: namaSantri,
                MarhalahID: row.marhalahId as any,
                Kelas: kelas,
                Aktif: true
              };
              const santriRes = await apiRequest('POST', '/api/santri', santriData);
              const newSantri = await santriRes.json();
              santriId = newSantri.SantriID;
              santriCache.set(santriKey, santriId);
            }
          }

          // 2. Create or get Musammi
          let musammiId = '';
          const musammiKey = `${namaMusammi.toLowerCase()}|${row.marhalahMusammi}|${kelasMusammi}`;
          
          if (musammiCache.has(musammiKey)) {
            musammiId = musammiCache.get(musammiKey)!;
          } else {
            const existingMusammi = allMusammi?.find(m => 
              m.NamaMusammi.toLowerCase().trim() === namaMusammi.toLowerCase() &&
              m.MarhalahID === row.marhalahMusammi &&
              m.KelasMusammi.trim() === kelasMusammi
            );

            if (existingMusammi) {
              musammiId = existingMusammi.MusammiID;
              musammiCache.set(musammiKey, musammiId);
            } else {
              const musammiData = {
                NamaMusammi: namaMusammi,
                MarhalahID: row.marhalahMusammi as any,
                KelasMusammi: kelasMusammi,
                Catatan: ''
              };
              const musammiRes = await apiRequest('POST', '/api/musammi', musammiData);
              const newMusammi = await musammiRes.json();
              musammiId = newMusammi.MusammiID;
              musammiCache.set(musammiKey, musammiId);
            }
          }

          // 3. Create or get Halaqah
          let halaqahId = '';
          const halaqahKey = `${row.nomorUrutHalaqah}|${row.marhalahId}|${musammiId}`;
          
          if (halaqahCache.has(halaqahKey)) {
            halaqahId = halaqahCache.get(halaqahKey)!;
          } else {
            const existingHalaqah = allHalaqah?.find(h => 
              h.NomorUrutHalaqah === row.nomorUrutHalaqah &&
              h.MarhalahID === row.marhalahId &&
              h.MusammiID === musammiId
            );

            if (existingHalaqah) {
              halaqahId = existingHalaqah.HalaqahID;
              halaqahCache.set(halaqahKey, halaqahId);
            } else {
              const halaqahData: InsertHalaqah = {
                NomorUrutHalaqah: row.nomorUrutHalaqah,
                MarhalahID: row.marhalahId as any,
                MusammiID: musammiId,
                KelasMusammi: row.kelasMusammi,
                NamaHalaqah: `Halaqah ${row.nomorUrutHalaqah}`
              };
              const halaqahRes = await apiRequest('POST', '/api/halaqah', halaqahData);
              const newHalaqah = await halaqahRes.json();
              halaqahId = newHalaqah.HalaqahID;
              halaqahCache.set(halaqahKey, halaqahId);
            }
          }

          // 4. Add santri to halaqah - with robust error handling
          try {
            const memberData: InsertHalaqahMembers = {
              HalaqahID: halaqahId,
              SantriID: santriId,
              TanggalMulai: new Date().toISOString().split('T')[0],
              TanggalSelesai: ''
            };
            const memberRes = await apiRequest('POST', '/api/halaqah-members', memberData);
            
            // Check if response is not ok
            if (!memberRes.ok) {
              const errorData = await memberRes.json();
              // Ignore 409 Conflict or 500 with "already" message
              if (memberRes.status === 409 || 
                  (memberRes.status === 500 && errorData.error?.toLowerCase().includes('already'))) {
                // Skip - santri already in halaqah, this is not an error
              } else {
                throw new Error(errorData.error || 'Gagal menambahkan member');
              }
            }
          } catch (memberError: any) {
            // Only swallow "already exists" errors
            if (!memberError.message?.toLowerCase().includes('already')) {
              throw memberError;
            }
          }

          // 5. Create hafalan record if jumlahHafalan > 0
          if (row.jumlahHafalan > 0) {
            const hafalanData = {
              Bulan: bulan,
              SantriID: santriId,
              HalaqahID: halaqahId,
              MarhalahID: row.marhalahId,
              Kelas: kelas, // Use normalized kelas
              MusammiID: musammiId,
              JumlahHafalan: row.jumlahHafalan
            };
            await apiRequest('POST', '/api/hafalan', hafalanData);
          }
          
          results.push({ row: i + 1, success: true });
        } catch (error: any) {
          results.push({ row: i + 1, success: false, error: error.message });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['/api/santri'] });
      queryClient.invalidateQueries({ queryKey: ['/api/musammi'] });
      queryClient.invalidateQueries({ queryKey: ['/api/halaqah'] });
      queryClient.invalidateQueries({ queryKey: ['/api/halaqah-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hafalan'] });
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (failCount === 0) {
        toast({ 
          title: "Berhasil", 
          description: `${successCount} data halaqah berhasil ditambahkan` 
        });
        // Close dialog and reset only if all succeeded
        setShowBulkForm(false);
        setRows([{
          id: crypto.randomUUID(),
          namaSantri: '',
          kelas: '',
          marhalahId: 'MUT',
          nomorUrutHalaqah: 1,
          namaMusammi: '',
          marhalahMusammi: 'JAM',
          kelasMusammi: '',
          jumlahHafalan: 0
        }]);
      } else {
        const failedRows = results.filter(r => !r.success);
        const failedRowsStr = failedRows.map(r => r.row).join(', ');
        const firstErrors = failedRows.slice(0, 2).map(r => r.error).join('; ');
        
        toast({ 
          title: "Selesai dengan Error", 
          description: `${successCount} berhasil, ${failCount} gagal (baris: ${failedRowsStr}). Error: ${firstErrors}`,
          variant: "destructive"
        });
        // Keep dialog open - user can fix and retry
      }
    },
    onError: (error: Error) => {
      toast({ 
        title: "Gagal", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const addRow = () => {
    setRows([...rows, {
      id: crypto.randomUUID(),
      namaSantri: '',
      kelas: '',
      marhalahId: 'MUT',
      nomorUrutHalaqah: 1,
      namaMusammi: '',
      marhalahMusammi: 'JAM',
      kelasMusammi: '',
      jumlahHafalan: 0
    }]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const updateRow = (id: string, field: keyof HalaqahRow, value: any) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const getKelasOptions = (marhalahId: string) => {
    return lookups?.kelas.filter(k => k.MarhalahID === marhalahId) || [];
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header line
      const dataLines = lines.slice(1);
      
      const importedRows: HalaqahRow[] = dataLines.map(line => {
        const [namaSantri, kelas, marhalahId, nomorUrutHalaqah, namaMusammi, marhalahMusammi, kelasMusammi, jumlahHafalan] = line.split(',').map(s => s.trim());
        
        return {
          id: crypto.randomUUID(),
          namaSantri,
          kelas,
          marhalahId: (marhalahId || 'MUT') as any,
          nomorUrutHalaqah: parseInt(nomorUrutHalaqah) || 1,
          namaMusammi,
          marhalahMusammi: (marhalahMusammi || 'JAM') as any,
          kelasMusammi,
          jumlahHafalan: parseFloat(jumlahHafalan) || 0
        };
      });

      if (importedRows.length > 0) {
        setRows(importedRows);
        toast({ 
          title: "Import Berhasil", 
          description: `${importedRows.length} baris data berhasil diimport` 
        });
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const downloadTemplate = () => {
    const headers = ['Nama Santri', 'Kelas', 'Marhalah', 'Nomor Urut Halaqah', 'Nama Musammi', 'Marhalah Musammi', 'Kelas Musammi', 'Jumlah Hafalan (Juz)'];
    const example = ['Ahmad', '1A', 'MUT', '1', 'Ustadz Ali', 'JAM', 'TQS', '2.5'];
    const csv = [headers.join(','), example.join(',')].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-halaqah.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loadingHalaqah) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-96" />
          <Skeleton className="h-5 w-full max-w-2xl mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Halaqah</h1>
          <p className="text-muted-foreground mt-2">
            Kelola data santri, musammi, dan keanggotaan halaqah
          </p>
        </div>
        <Button onClick={() => setShowBulkForm(true)} data-testid="button-add-halaqah">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Halaqah
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Halaqah</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allHalaqah?.map((h) => {
              const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
              return (
                <div key={h.HalaqahID} className="flex items-center justify-between p-3 border rounded-lg hover-elevate" data-testid={`item-halaqah-${h.HalaqahID}`}>
                  <div>
                    <p className="font-medium">Halaqah {h.NomorUrutHalaqah} - {h.NamaHalaqah || 'Tanpa Nama'}</p>
                    <p className="text-sm text-muted-foreground">
                      {lookups?.marhalah.find(mar => mar.MarhalahID === h.MarhalahID)?.NamaMarhalah} - Musammi: {musammi?.NamaMusammi || 'N/A'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Form Dialog */}
      <Dialog open={showBulkForm} onOpenChange={(open) => !open && setShowBulkForm(false)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto" data-testid="dialog-bulk-halaqah">
          <DialogHeader>
            <DialogTitle>Tambah Data Halaqah</DialogTitle>
            <DialogDescription>
              Tambahkan data santri, halaqah, dan musammi sekaligus dalam bentuk tabel
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {hasDataError && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  Error memuat data. Silakan refresh halaman dan coba lagi.
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={addRow}
                data-testid="button-add-row"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Baris
              </Button>
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('csv-upload')?.click()}
                data-testid="button-import-csv"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                data-testid="button-download-template"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImportCSV}
              />
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nama Santri</TableHead>
                    <TableHead className="min-w-[100px]">Kelas</TableHead>
                    <TableHead className="min-w-[120px]">Marhalah</TableHead>
                    <TableHead className="min-w-[80px]">No. Halaqah</TableHead>
                    <TableHead className="min-w-[150px]">Nama Musammi</TableHead>
                    <TableHead className="min-w-[120px]">Marhalah Musammi</TableHead>
                    <TableHead className="min-w-[120px]">Kelas Musammi</TableHead>
                    <TableHead className="min-w-[100px]">Hafalan (Juz)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.id} data-testid={`row-halaqah-${index}`}>
                      <TableCell>
                        <Input
                          value={row.namaSantri}
                          onChange={(e) => updateRow(row.id, 'namaSantri', e.target.value)}
                          placeholder="Nama santri"
                          data-testid={`input-nama-santri-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.kelas}
                          onValueChange={(value) => updateRow(row.id, 'kelas', value)}
                        >
                          <SelectTrigger data-testid={`select-kelas-${index}`}>
                            <SelectValue placeholder="Kelas" />
                          </SelectTrigger>
                          <SelectContent>
                            {getKelasOptions(row.marhalahId).map((k) => (
                              <SelectItem key={k.Kelas} value={k.Kelas}>
                                {k.Kelas}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.marhalahId}
                          onValueChange={(value) => {
                            updateRow(row.id, 'marhalahId', value);
                            updateRow(row.id, 'kelas', '');
                          }}
                        >
                          <SelectTrigger data-testid={`select-marhalah-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {lookups?.marhalah.filter(m => m.MarhalahID !== 'JAM').map((m) => (
                              <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                                {m.NamaMarhalah}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.nomorUrutHalaqah}
                          onChange={(e) => updateRow(row.id, 'nomorUrutHalaqah', parseInt(e.target.value) || 1)}
                          data-testid={`input-nomor-halaqah-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.namaMusammi}
                          onChange={(e) => updateRow(row.id, 'namaMusammi', e.target.value)}
                          placeholder="Nama musammi"
                          data-testid={`input-nama-musammi-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.marhalahMusammi}
                          onValueChange={(value) => {
                            updateRow(row.id, 'marhalahMusammi', value);
                            updateRow(row.id, 'kelasMusammi', '');
                          }}
                        >
                          <SelectTrigger data-testid={`select-marhalah-musammi-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {lookups?.marhalah.map((m) => (
                              <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                                {m.NamaMarhalah}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.kelasMusammi}
                          onValueChange={(value) => updateRow(row.id, 'kelasMusammi', value)}
                        >
                          <SelectTrigger data-testid={`select-kelas-musammi-${index}`}>
                            <SelectValue placeholder="Kelas" />
                          </SelectTrigger>
                          <SelectContent>
                            {getKelasOptions(row.marhalahMusammi).map((k) => (
                              <SelectItem key={k.Kelas} value={k.Kelas}>
                                {k.Kelas}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          value={row.jumlahHafalan}
                          onChange={(e) => updateRow(row.id, 'jumlahHafalan', parseFloat(e.target.value) || 0)}
                          data-testid={`input-hafalan-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                          data-testid={`button-remove-row-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBulkForm(false)}
              data-testid="button-cancel"
            >
              Batal
            </Button>
            <Button 
              onClick={() => bulkCreateMutation.mutate(rows)}
              disabled={
                !isDataReady ||
                bulkCreateMutation.isPending || 
                rows.some(r => !r.namaSantri || !r.kelas || !r.namaMusammi || !r.kelasMusammi)
              }
              data-testid="button-save-bulk"
            >
              {!isDataReady ? 'Memuat...' : bulkCreateMutation.isPending ? 'Menyimpan...' : 'Simpan Semua'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
