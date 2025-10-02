import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AbsensiReportResponse, LookupsResponse } from "@shared/schema";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function Laporan() {
  const [tanggalDari, setTanggalDari] = useState<string>("");
  const [tanggalSampai, setTanggalSampai] = useState<string>("");
  const [marhalahId, setMarhalahId] = useState<string>("all");
  const [kelas, setKelas] = useState<string>("all");
  const [peran, setPeran] = useState<string>("all");
  const { toast } = useToast();

  const { data: lookups, isLoading: isLoadingLookups } = useQuery<LookupsResponse>({
    queryKey: ['/api/lookups'],
  });

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (tanggalDari) params.append("tanggalDari", tanggalDari);
    if (tanggalSampai) params.append("tanggalSampai", tanggalSampai);
    if (marhalahId && marhalahId !== "all") params.append("marhalah", marhalahId);
    if (kelas && kelas !== "all") params.append("kelas", kelas);
    if (peran && peran !== "all") params.append("peran", peran);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  const queryString = buildQueryString();
  
  const { data: reportData, isLoading, error } = useQuery<AbsensiReportResponse>({
    queryKey: [`/api/absensi/report${queryString}`],
  });

  const kelasOptions = lookups?.kelas.filter(
    k => !marhalahId || marhalahId === "all" || k.MarhalahID === marhalahId
  ) || [];

  const handleExportExcel = () => {
    if (!reportData || reportData.data.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data untuk di-export",
        variant: "destructive",
      });
      return;
    }

    const worksheetData = reportData.data.map((item) => ({
      Tanggal: item.tanggal,
      Nama: item.nama,
      Peran: item.peran,
      Marhalah: getMarhalahLabel(item.marhalahId),
      Kelas: item.kelas,
      Waktu: getWaktuLabel(item.waktuId),
      Status: getStatusLabel(item.statusId),
      Keterangan: item.keterangan || '-',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(worksheetData);

    const wscols = [
      { wch: 12 },
      { wch: 25 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 30 },
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Absensi');

    const filterInfo = [];
    if (tanggalDari && tanggalSampai) {
      filterInfo.push(`Tanggal: ${tanggalDari} s/d ${tanggalSampai}`);
    } else if (tanggalDari) {
      filterInfo.push(`Tanggal Dari: ${tanggalDari}`);
    } else if (tanggalSampai) {
      filterInfo.push(`Tanggal Sampai: ${tanggalSampai}`);
    }
    if (marhalahId && marhalahId !== 'all') {
      const marhalah = lookups?.marhalah.find(m => m.MarhalahID === marhalahId);
      filterInfo.push(`Marhalah: ${marhalah?.NamaMarhalah || marhalahId}`);
    }
    if (kelas && kelas !== 'all') filterInfo.push(`Kelas: ${kelas}`);
    if (peran && peran !== 'all') filterInfo.push(`Peran: ${peran}`);

    const filename = `Laporan_Absensi${filterInfo.length > 0 ? '_' + filterInfo.join('_').replace(/[: ]/g, '_') : ''}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.writeFile(wb, filename);

    toast({
      title: "Export berhasil",
      description: `File ${filename} berhasil di-download`,
    });
  };

  const handleExportPDF = () => {
    if (!reportData || reportData.data.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data untuk di-export",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Laporan Absensi', 14, 15);

    let yPos = 25;
    doc.setFontSize(10);
    
    const filters = [];
    if (tanggalDari && tanggalSampai) {
      filters.push(`Tanggal: ${tanggalDari} s/d ${tanggalSampai}`);
    } else if (tanggalDari) {
      filters.push(`Tanggal Dari: ${tanggalDari}`);
    } else if (tanggalSampai) {
      filters.push(`Tanggal Sampai: ${tanggalSampai}`);
    }
    if (marhalahId && marhalahId !== 'all') {
      const marhalah = lookups?.marhalah.find(m => m.MarhalahID === marhalahId);
      filters.push(`Marhalah: ${marhalah?.NamaMarhalah || marhalahId}`);
    }
    if (kelas && kelas !== 'all') filters.push(`Kelas: ${kelas}`);
    if (peran && peran !== 'all') filters.push(`Peran: ${peran}`);

    if (filters.length > 0) {
      doc.text('Filter:', 14, yPos);
      yPos += 5;
      filters.forEach(filter => {
        doc.text(`• ${filter}`, 14, yPos);
        yPos += 5;
      });
      yPos += 3;
    }

    doc.text('Statistik:', 14, yPos);
    yPos += 5;
    doc.text(`Hadir: ${reportData.stats.hadir} | Sakit: ${reportData.stats.sakit} | Izin: ${reportData.stats.izin} | Alpa: ${reportData.stats.alpa} | Terlambat: ${reportData.stats.terlambat}`, 14, yPos);
    yPos += 8;

    const tableData = reportData.data.map((item) => [
      item.tanggal,
      item.nama,
      item.peran,
      getMarhalahLabel(item.marhalahId),
      item.kelas,
      getWaktuLabel(item.waktuId),
      getStatusLabel(item.statusId),
      item.keterangan || '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Tanggal', 'Nama', 'Peran', 'Marhalah', 'Kelas', 'Waktu', 'Status', 'Keterangan']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 35 },
        2: { cellWidth: 15 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 20 },
        7: { cellWidth: 'auto' },
      },
    });

    const filename = `Laporan_Absensi_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    toast({
      title: "Export berhasil",
      description: `File ${filename} berhasil di-download`,
    });
  };

  const getStatusLabel = (statusId: string) => {
    const status = lookups?.kehadiran.find(k => k.StatusID === statusId);
    return status?.NamaStatus || statusId;
  };

  const getMarhalahLabel = (marhalahId: string) => {
    const marhalah = lookups?.marhalah.find(m => m.MarhalahID === marhalahId);
    return marhalah?.NamaMarhalah || marhalahId;
  };

  const getWaktuLabel = (waktuId: string) => {
    const waktu = lookups?.waktu.find(w => w.WaktuID === waktuId);
    return waktu?.NamaWaktu || waktuId;
  };

  if (isLoadingLookups) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-laporan-title">Laporan Absensi</h1>
        <p className="text-muted-foreground mt-2">
          Lihat dan export laporan kehadiran santri dan musammi
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggalDari">Tanggal Dari</Label>
              <Input
                id="tanggalDari"
                type="date"
                value={tanggalDari}
                onChange={(e) => setTanggalDari(e.target.value)}
                data-testid="input-filter-tanggal-dari"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggalSampai">Tanggal Sampai</Label>
              <Input
                id="tanggalSampai"
                type="date"
                value={tanggalSampai}
                onChange={(e) => setTanggalSampai(e.target.value)}
                data-testid="input-filter-tanggal-sampai"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marhalah">Marhalah</Label>
              <Select value={marhalahId} onValueChange={setMarhalahId}>
                <SelectTrigger id="marhalah" data-testid="select-filter-marhalah">
                  <SelectValue placeholder="Semua Marhalah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Marhalah</SelectItem>
                  {lookups?.marhalah.map((m) => (
                    <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                      {m.NamaMarhalah}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Select value={kelas} onValueChange={setKelas}>
                <SelectTrigger id="kelas" data-testid="select-filter-kelas">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasOptions.map((k, idx) => (
                    <SelectItem key={`${k.MarhalahID}-${k.Kelas}-${idx}`} value={k.Kelas}>
                      {k.Kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="peran">Peran</Label>
              <Select value={peran} onValueChange={setPeran}>
                <SelectTrigger id="peran" data-testid="select-filter-peran">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="santri">Santri</SelectItem>
                  <SelectItem value="musammi">Musammi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              data-testid="button-export-excel"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              data-testid="button-export-pdf"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive font-semibold">Gagal memuat data laporan</p>
              <p className="text-muted-foreground text-sm mt-2">
                {error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && reportData && reportData.total > 0 && (
        <Card data-testid="card-distribution-chart">
          <CardHeader>
            <CardTitle>Distribusi Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'Hadir', value: reportData.stats.hadir, fill: '#22c55e' },
                  { name: 'Sakit', value: reportData.stats.sakit, fill: '#eab308' },
                  { name: 'Izin', value: reportData.stats.izin, fill: '#3b82f6' },
                  { name: 'Alpa', value: reportData.stats.alpa, fill: '#ef4444' },
                  { name: 'Terlambat', value: reportData.stats.terlambat, fill: '#f97316' },
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="stroke-muted-foreground" />
                <YAxis className="stroke-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} data-testid="chart-bar-attendance">
                  {[
                    { name: 'Hadir', value: reportData.stats.hadir, fill: '#22c55e' },
                    { name: 'Sakit', value: reportData.stats.sakit, fill: '#eab308' },
                    { name: 'Izin', value: reportData.stats.izin, fill: '#3b82f6' },
                    { name: 'Alpa', value: reportData.stats.alpa, fill: '#ef4444' },
                    { name: 'Terlambat', value: reportData.stats.terlambat, fill: '#f97316' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} data-testid={`chart-cell-${entry.name.toLowerCase()}`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && reportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle>Data Absensi</CardTitle>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2" data-testid="stat-hadir">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Hadir: {reportData.stats.hadir}</span>
                </div>
                <div className="flex items-center gap-2" data-testid="stat-sakit">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Sakit: {reportData.stats.sakit}</span>
                </div>
                <div className="flex items-center gap-2" data-testid="stat-izin">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Izin: {reportData.stats.izin}</span>
                </div>
                <div className="flex items-center gap-2" data-testid="stat-alpa">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Alpa: {reportData.stats.alpa}</span>
                </div>
                <div className="flex items-center gap-2" data-testid="stat-terlambat">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Terlambat: {reportData.stats.terlambat}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {reportData.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data absensi yang sesuai dengan filter
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead>Marhalah</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.data.map((item) => (
                      <TableRow key={item.id} data-testid={`row-absensi-${item.id}`}>
                        <TableCell data-testid={`cell-tanggal-${item.id}`}>{item.tanggal}</TableCell>
                        <TableCell data-testid={`cell-nama-${item.id}`}>{item.nama}</TableCell>
                        <TableCell data-testid={`cell-peran-${item.id}`}>{item.peran}</TableCell>
                        <TableCell data-testid={`cell-marhalah-${item.id}`}>{getMarhalahLabel(item.marhalahId)}</TableCell>
                        <TableCell data-testid={`cell-kelas-${item.id}`}>{item.kelas}</TableCell>
                        <TableCell data-testid={`cell-waktu-${item.id}`}>{getWaktuLabel(item.waktuId)}</TableCell>
                        <TableCell data-testid={`cell-status-${item.id}`}>
                          <span 
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              item.statusId === 'HADIR' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              item.statusId === 'SAKIT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              item.statusId === 'IZIN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              item.statusId === 'ALPA' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            }`}
                          >
                            {getStatusLabel(item.statusId)}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`cell-keterangan-${item.id}`}>{item.keterangan || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground" data-testid="text-total-data">
              Total: {reportData.total} data
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
