import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, TrendingUp, Upload, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  HafalanBulanan,
  MurojaahBulanan,
  PenambahanHafalan,
  InsertHafalanBulanan,
  InsertMurojaahBulanan,
  InsertPenambahanHafalan,
  Santri,
  Halaqah,
  Musammi,
  LookupsResponse,
  HalaqahMembers
} from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Perkembangan() {
  const { toast } = useToast();
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedMarhalah, setSelectedMarhalah] = useState<string>('ALL');
  const [selectedKelas, setSelectedKelas] = useState<string>('ALL');

  // Table-based input state
  const [addingHafalan, setAddingHafalan] = useState(false);
  const [addingMurojaah, setAddingMurojaah] = useState(false);
  const [addingPenambahan, setAddingPenambahan] = useState(false);

  // CSV Upload refs
  const hafalanFileRef = useRef<HTMLInputElement>(null);
  const murojaahFileRef = useRef<HTMLInputElement>(null);
  const penambahanFileRef = useRef<HTMLInputElement>(null);

  // Forms for new rows
  const [hafalanForm, setHafalanForm] = useState<InsertHafalanBulanan>({
    Bulan: selectedMonth,
    SantriID: '',
    HalaqahID: '',
    MarhalahID: 'MUT',
    Kelas: '',
    MusammiID: '',
    JumlahHafalan: 0
  });

  const [murojaahForm, setMurojaahForm] = useState<InsertMurojaahBulanan>({
    Bulan: selectedMonth,
    SantriID: '',
    HalaqahID: '',
    MarhalahID: 'MUT',
    Kelas: '',
    MusammiID: '',
    JumlahMurojaah: 0
  });

  const [penambahanForm, setPenambahanForm] = useState<InsertPenambahanHafalan>({
    Bulan: selectedMonth,
    SantriID: '',
    HalaqahID: '',
    MarhalahID: 'MUT',
    Kelas: '',
    MusammiID: '',
    JumlahPenambahan: 0,
    Catatan: ''
  });

  // Fetch lookups
  const { data: lookups } = useQuery<LookupsResponse>({
    queryKey: ['/api/lookups'],
  });

  // Fetch data
  const { data: hafalanData, isLoading: loadingHafalan } = useQuery<HafalanBulanan[]>({
    queryKey: ['/api/hafalan', { bulan: selectedMonth, marhalah: selectedMarhalah === 'ALL' ? '' : selectedMarhalah }],
  });

  const { data: murojaahData, isLoading: loadingMurojaah } = useQuery<MurojaahBulanan[]>({
    queryKey: ['/api/murojaah', { bulan: selectedMonth, marhalah: selectedMarhalah === 'ALL' ? '' : selectedMarhalah }],
  });

  const { data: penambahanData, isLoading: loadingPenambahan } = useQuery<PenambahanHafalan[]>({
    queryKey: ['/api/penambahan', { bulan: selectedMonth, marhalah: selectedMarhalah === 'ALL' ? '' : selectedMarhalah }],
  });

  const { data: allSantri } = useQuery<Santri[]>({
    queryKey: ['/api/santri'],
  });

  const { data: allHalaqah } = useQuery<Halaqah[]>({
    queryKey: ['/api/halaqah'],
  });

  const { data: allMusammi } = useQuery<Musammi[]>({
    queryKey: ['/api/musammi'],
  });

  // Mutations
  const createHafalanMutation = useMutation({
    mutationFn: async (data: InsertHafalanBulanan) => {
      const res = await apiRequest('POST', '/api/hafalan', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hafalan'] });
      toast({ title: "Berhasil", description: "Data hafalan berhasil ditambahkan" });
      setAddingHafalan(false);
      resetHafalanForm();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  const createMurojaahMutation = useMutation({
    mutationFn: async (data: InsertMurojaahBulanan) => {
      const res = await apiRequest('POST', '/api/murojaah', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/murojaah'] });
      toast({ title: "Berhasil", description: "Data murojaah berhasil ditambahkan" });
      setAddingMurojaah(false);
      resetMurojaahForm();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  const createPenambahanMutation = useMutation({
    mutationFn: async (data: InsertPenambahanHafalan) => {
      const res = await apiRequest('POST', '/api/penambahan', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hafalan'] });
      queryClient.invalidateQueries({ queryKey: ['/api/penambahan'] });
      toast({ 
        title: "Berhasil", 
        description: "Penambahan hafalan berhasil disimpan dan hafalan bulanan telah diperbarui",
        duration: 5000
      });
      setAddingPenambahan(false);
      resetPenambahanForm();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  });

  // Batch upload mutations
  const batchUploadHafalanMutation = useMutation({
    mutationFn: async (data: InsertHafalanBulanan[]) => {
      const res = await apiRequest('POST', '/api/hafalan/batch', { data });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details ? 
          `Error pada baris: ${errorData.details.map((e: any) => `#${e.row}: ${e.error}`).join(', ')}` :
          errorData.error || 'Failed to upload');
      }
      return await res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/hafalan'] });
      toast({ 
        title: "Berhasil", 
        description: `${result.count} data hafalan berhasil diimport`,
        duration: 5000
      });
      if (hafalanFileRef.current) hafalanFileRef.current.value = '';
    },
    onError: (error: Error) => {
      toast({ title: "Gagal Import", description: error.message, variant: "destructive", duration: 7000 });
      if (hafalanFileRef.current) hafalanFileRef.current.value = '';
    }
  });

  const batchUploadMurojaahMutation = useMutation({
    mutationFn: async (data: InsertMurojaahBulanan[]) => {
      const res = await apiRequest('POST', '/api/murojaah/batch', { data });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details ? 
          `Error pada baris: ${errorData.details.map((e: any) => `#${e.row}: ${e.error}`).join(', ')}` :
          errorData.error || 'Failed to upload');
      }
      return await res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/murojaah'] });
      toast({ 
        title: "Berhasil", 
        description: `${result.count} data murojaah berhasil diimport`,
        duration: 5000
      });
      if (murojaahFileRef.current) murojaahFileRef.current.value = '';
    },
    onError: (error: Error) => {
      toast({ title: "Gagal Import", description: error.message, variant: "destructive", duration: 7000 });
      if (murojaahFileRef.current) murojaahFileRef.current.value = '';
    }
  });

  const batchUploadPenambahanMutation = useMutation({
    mutationFn: async (data: InsertPenambahanHafalan[]) => {
      const res = await apiRequest('POST', '/api/penambahan/batch', { data });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details ? 
          `Error pada baris: ${errorData.details.map((e: any) => `#${e.row}: ${e.error}`).join(', ')}` :
          errorData.error || 'Failed to upload');
      }
      return await res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/hafalan'] });
      queryClient.invalidateQueries({ queryKey: ['/api/penambahan'] });
      toast({ 
        title: "Berhasil", 
        description: `${result.count} data penambahan hafalan berhasil diimport dan hafalan bulanan diperbarui`,
        duration: 5000
      });
      if (penambahanFileRef.current) penambahanFileRef.current.value = '';
    },
    onError: (error: Error) => {
      toast({ title: "Gagal Import", description: error.message, variant: "destructive", duration: 7000 });
      if (penambahanFileRef.current) penambahanFileRef.current.value = '';
    }
  });

  const handleCSVUpload = (file: File, type: 'hafalan' | 'murojaah' | 'penambahan') => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as any[];
          
          if (data.length === 0) {
            toast({ 
              title: "CSV Kosong", 
              description: "File CSV tidak mengandung data", 
              variant: "destructive" 
            });
            return;
          }
          
          const parseNumber = (val: any): number => {
            if (val === null || val === undefined || val === '') return 0;
            const num = typeof val === 'string' ? parseFloat(val.trim()) : Number(val);
            return isNaN(num) || num < 0 ? 0 : num;
          };
          
          const normalizeString = (val: any, defaultVal: string = ''): string => {
            return (val || defaultVal).toString().trim();
          };
          
          const normalizeMarhalah = (val: any): "MUT" | "ALI" | "JAM" => {
            const normalized = normalizeString(val, 'MUT').toUpperCase();
            if (normalized === 'ALI' || normalized === 'JAM') return normalized as "MUT" | "ALI" | "JAM";
            return 'MUT';
          };
          
          if (type === 'hafalan') {
            const validRows: InsertHafalanBulanan[] = [];
            const warnings: string[] = [];
            
            data.forEach((row, index) => {
              const jumlah = parseNumber(row.JumlahHafalan || row.jumlahHafalan || row.Hafalan);
              const bulan = normalizeString(row.Bulan || row.bulan || row.Month, selectedMonth);
              const santriId = normalizeString(row.SantriID || row.santriId || row.Santri);
              const halaqahId = normalizeString(row.HalaqahID || row.halaqahId || row.Halaqah);
              
              if (!santriId || !halaqahId) {
                warnings.push(`Baris ${index + 1}: SantriID atau HalaqahID kosong, dilewati`);
                return;
              }
              
              validRows.push({
                Bulan: bulan,
                SantriID: santriId,
                HalaqahID: halaqahId,
                MarhalahID: normalizeMarhalah(row.MarhalahID || row.marhalahId || row.Marhalah),
                Kelas: normalizeString(row.Kelas || row.kelas || row.Class),
                MusammiID: normalizeString(row.MusammiID || row.musammiId || row.Musammi),
                JumlahHafalan: jumlah
              });
            });
            
            if (validRows.length === 0) {
              toast({ 
                title: "Tidak Ada Data", 
                description: "Tidak ada data yang bisa diimport dari CSV", 
                variant: "destructive" 
              });
              return;
            }
            
            if (warnings.length > 0) {
              console.log('CSV Upload Warnings:', warnings);
            }
            
            batchUploadHafalanMutation.mutate(validRows);
          } else if (type === 'murojaah') {
            const validRows: InsertMurojaahBulanan[] = [];
            const warnings: string[] = [];
            
            data.forEach((row, index) => {
              const jumlah = parseNumber(row.JumlahMurojaah || row.jumlahMurojaah || row.Murojaah);
              const bulan = normalizeString(row.Bulan || row.bulan || row.Month, selectedMonth);
              const santriId = normalizeString(row.SantriID || row.santriId || row.Santri);
              const halaqahId = normalizeString(row.HalaqahID || row.halaqahId || row.Halaqah);
              
              if (!santriId || !halaqahId) {
                warnings.push(`Baris ${index + 1}: SantriID atau HalaqahID kosong, dilewati`);
                return;
              }
              
              validRows.push({
                Bulan: bulan,
                SantriID: santriId,
                HalaqahID: halaqahId,
                MarhalahID: normalizeMarhalah(row.MarhalahID || row.marhalahId || row.Marhalah),
                Kelas: normalizeString(row.Kelas || row.kelas || row.Class),
                MusammiID: normalizeString(row.MusammiID || row.musammiId || row.Musammi),
                JumlahMurojaah: jumlah
              });
            });
            
            if (validRows.length === 0) {
              toast({ 
                title: "Tidak Ada Data", 
                description: "Tidak ada data yang bisa diimport dari CSV", 
                variant: "destructive" 
              });
              return;
            }
            
            if (warnings.length > 0) {
              console.log('CSV Upload Warnings:', warnings);
            }
            
            batchUploadMurojaahMutation.mutate(validRows);
          } else {
            const validRows: InsertPenambahanHafalan[] = [];
            const warnings: string[] = [];
            
            data.forEach((row, index) => {
              const jumlah = parseNumber(row.JumlahPenambahan || row.jumlahPenambahan || row.Penambahan);
              const bulan = normalizeString(row.Bulan || row.bulan || row.Month, selectedMonth);
              const santriId = normalizeString(row.SantriID || row.santriId || row.Santri);
              const halaqahId = normalizeString(row.HalaqahID || row.halaqahId || row.Halaqah);
              
              if (!santriId || !halaqahId) {
                warnings.push(`Baris ${index + 1}: SantriID atau HalaqahID kosong, dilewati`);
                return;
              }
              
              validRows.push({
                Bulan: bulan,
                SantriID: santriId,
                HalaqahID: halaqahId,
                MarhalahID: normalizeMarhalah(row.MarhalahID || row.marhalahId || row.Marhalah),
                Kelas: normalizeString(row.Kelas || row.kelas || row.Class),
                MusammiID: normalizeString(row.MusammiID || row.musammiId || row.Musammi),
                JumlahPenambahan: Math.round(jumlah),
                Catatan: normalizeString(row.Catatan || row.catatan || row.Notes)
              });
            });
            
            if (validRows.length === 0) {
              toast({ 
                title: "Tidak Ada Data", 
                description: "Tidak ada data yang bisa diimport dari CSV", 
                variant: "destructive" 
              });
              return;
            }
            
            if (warnings.length > 0) {
              console.log('CSV Upload Warnings:', warnings);
            }
            
            batchUploadPenambahanMutation.mutate(validRows);
          }
        } catch (error: any) {
          toast({ 
            title: "Error Parsing CSV", 
            description: error.message, 
            variant: "destructive" 
          });
        }
      },
      error: (error) => {
        toast({ 
          title: "Error Reading CSV", 
          description: error.message, 
          variant: "destructive" 
        });
      }
    });
  };

  const resetHafalanForm = () => {
    setHafalanForm({
      Bulan: selectedMonth,
      SantriID: '',
      HalaqahID: '',
      MarhalahID: 'MUT',
      Kelas: '',
      MusammiID: '',
      JumlahHafalan: 0
    });
  };

  const resetMurojaahForm = () => {
    setMurojaahForm({
      Bulan: selectedMonth,
      SantriID: '',
      HalaqahID: '',
      MarhalahID: 'MUT',
      Kelas: '',
      MusammiID: '',
      JumlahMurojaah: 0
    });
  };

  const resetPenambahanForm = () => {
    setPenambahanForm({
      Bulan: selectedMonth,
      SantriID: '',
      HalaqahID: '',
      MarhalahID: 'MUT',
      Kelas: '',
      MusammiID: '',
      JumlahPenambahan: 0,
      Catatan: ''
    });
  };

  const handleSantriChange = (santriId: string, formType: 'hafalan' | 'murojaah' | 'penambahan') => {
    const santri = allSantri?.find(s => s.SantriID === santriId);
    if (!santri) return;

    const updates = {
      SantriID: santriId,
      MarhalahID: santri.MarhalahID,
      Kelas: santri.Kelas,
      HalaqahID: '',
      MusammiID: ''
    };

    if (formType === 'hafalan') {
      setHafalanForm({ ...hafalanForm, ...updates });
    } else if (formType === 'murojaah') {
      setMurojaahForm({ ...murojaahForm, ...updates });
    } else {
      setPenambahanForm({ ...penambahanForm, ...updates });
    }
  };

  const handleHalaqahChange = (halaqahId: string, formType: 'hafalan' | 'murojaah' | 'penambahan') => {
    const halaqah = allHalaqah?.find(h => h.HalaqahID === halaqahId);
    if (!halaqah) return;

    const updates = {
      HalaqahID: halaqahId,
      MusammiID: halaqah.MusammiID
    };

    if (formType === 'hafalan') {
      setHafalanForm({ ...hafalanForm, ...updates });
    } else if (formType === 'murojaah') {
      setMurojaahForm({ ...murojaahForm, ...updates });
    } else {
      setPenambahanForm({ ...penambahanForm, ...updates });
    }
  };

  const exportToExcel = (data: any[], filename: string, type: 'hafalan' | 'murojaah' | 'penambahan') => {
    let exportData: any[] = [];
    
    if (type === 'hafalan') {
      exportData = data.map((item: HafalanBulanan) => {
        const santri = allSantri?.find(s => s.SantriID === item.SantriID);
        const halaqah = allHalaqah?.find(h => h.HalaqahID === item.HalaqahID);
        const musammi = allMusammi?.find(m => m.MusammiID === item.MusammiID);
        const marhalah = lookups?.marhalah.find(m => m.MarhalahID === item.MarhalahID);
        
        return {
          'Bulan': item.Bulan,
          'Nama Santri': santri?.NamaSantri || 'N/A',
          'Kelas': item.Kelas,
          'Marhalah': marhalah?.NamaMarhalah || item.MarhalahID,
          'Halaqah': halaqah?.NomorUrutHalaqah || 'N/A',
          'Musammi': musammi?.NamaMusammi || 'N/A',
          'Hafalan (Juz)': item.JumlahHafalan
        };
      });
    } else if (type === 'murojaah') {
      exportData = data.map((item: MurojaahBulanan) => {
        const santri = allSantri?.find(s => s.SantriID === item.SantriID);
        const halaqah = allHalaqah?.find(h => h.HalaqahID === item.HalaqahID);
        const musammi = allMusammi?.find(m => m.MusammiID === item.MusammiID);
        const marhalah = lookups?.marhalah.find(m => m.MarhalahID === item.MarhalahID);
        
        return {
          'Bulan': item.Bulan,
          'Nama Santri': santri?.NamaSantri || 'N/A',
          'Kelas': item.Kelas,
          'Marhalah': marhalah?.NamaMarhalah || item.MarhalahID,
          'Halaqah': halaqah?.NomorUrutHalaqah || 'N/A',
          'Musammi': musammi?.NamaMusammi || 'N/A',
          'Murojaah (Juz)': item.JumlahMurojaah
        };
      });
    } else {
      exportData = data.map((item: PenambahanHafalan) => {
        const santri = allSantri?.find(s => s.SantriID === item.SantriID);
        const halaqah = allHalaqah?.find(h => h.HalaqahID === item.HalaqahID);
        const musammi = allMusammi?.find(m => m.MusammiID === item.MusammiID);
        const marhalah = lookups?.marhalah.find(m => m.MarhalahID === item.MarhalahID);
        const juz = (item.JumlahPenambahan / 20).toFixed(2);
        
        return {
          'Bulan': item.Bulan,
          'Nama Santri': santri?.NamaSantri || 'N/A',
          'Kelas': item.Kelas,
          'Marhalah': marhalah?.NamaMarhalah || item.MarhalahID,
          'Halaqah': halaqah?.NomorUrutHalaqah || 'N/A',
          'Musammi': musammi?.NamaMusammi || 'N/A',
          'Penambahan (Halaman)': item.JumlahPenambahan,
          'Penambahan (Juz)': juz,
          'Catatan': item.Catatan || '-'
        };
      });
    }
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    toast({
      title: "Berhasil Export",
      description: `Data berhasil diexport ke ${filename}.xlsx`
    });
  };

  const exportToPDF = (data: any[], filename: string, type: 'hafalan' | 'murojaah' | 'penambahan') => {
    const doc = new jsPDF();
    
    let title = '';
    let headers: string[][] = [];
    let rows: any[][] = [];
    
    if (type === 'hafalan') {
      title = 'Data Hafalan Bulanan';
      headers = [['Bulan', 'Nama Santri', 'Kelas', 'Marhalah', 'Halaqah', 'Musammi', 'Hafalan (Juz)']];
      rows = data.map((item: HafalanBulanan) => {
        const santri = allSantri?.find(s => s.SantriID === item.SantriID);
        const halaqah = allHalaqah?.find(h => h.HalaqahID === item.HalaqahID);
        const musammi = allMusammi?.find(m => m.MusammiID === item.MusammiID);
        const marhalah = lookups?.marhalah.find(m => m.MarhalahID === item.MarhalahID);
        
        return [
          item.Bulan,
          santri?.NamaSantri || 'N/A',
          item.Kelas,
          marhalah?.NamaMarhalah || item.MarhalahID,
          halaqah?.NomorUrutHalaqah?.toString() || 'N/A',
          musammi?.NamaMusammi || 'N/A',
          item.JumlahHafalan.toString()
        ];
      });
    } else if (type === 'murojaah') {
      title = 'Data Murojaah Bulanan';
      headers = [['Bulan', 'Nama Santri', 'Kelas', 'Marhalah', 'Halaqah', 'Musammi', 'Murojaah (Juz)']];
      rows = data.map((item: MurojaahBulanan) => {
        const santri = allSantri?.find(s => s.SantriID === item.SantriID);
        const halaqah = allHalaqah?.find(h => h.HalaqahID === item.HalaqahID);
        const musammi = allMusammi?.find(m => m.MusammiID === item.MusammiID);
        const marhalah = lookups?.marhalah.find(m => m.MarhalahID === item.MarhalahID);
        
        return [
          item.Bulan,
          santri?.NamaSantri || 'N/A',
          item.Kelas,
          marhalah?.NamaMarhalah || item.MarhalahID,
          halaqah?.NomorUrutHalaqah?.toString() || 'N/A',
          musammi?.NamaMusammi || 'N/A',
          item.JumlahMurojaah.toString()
        ];
      });
    } else {
      title = 'Data Penambahan Hafalan';
      headers = [['Bulan', 'Nama Santri', 'Kelas', 'Marhalah', 'Halaqah', 'Musammi', 'Penambahan (Hal)', 'Penambahan (Juz)', 'Catatan']];
      rows = data.map((item: PenambahanHafalan) => {
        const santri = allSantri?.find(s => s.SantriID === item.SantriID);
        const halaqah = allHalaqah?.find(h => h.HalaqahID === item.HalaqahID);
        const musammi = allMusammi?.find(m => m.MusammiID === item.MusammiID);
        const marhalah = lookups?.marhalah.find(m => m.MarhalahID === item.MarhalahID);
        const juz = (item.JumlahPenambahan / 20).toFixed(2);
        
        return [
          item.Bulan,
          santri?.NamaSantri || 'N/A',
          item.Kelas,
          marhalah?.NamaMarhalah || item.MarhalahID,
          halaqah?.NomorUrutHalaqah?.toString() || 'N/A',
          musammi?.NamaMusammi || 'N/A',
          item.JumlahPenambahan.toString(),
          juz,
          item.Catatan || '-'
        ];
      });
    }
    
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Bulan: ${selectedMonth}`, 14, 28);
    doc.text(`Filter: ${selectedMarhalah === 'ALL' ? 'Semua Marhalah' : lookups?.marhalah.find(m => m.MarhalahID === selectedMarhalah)?.NamaMarhalah || selectedMarhalah}`, 14, 34);
    if (selectedKelas !== 'ALL') {
      doc.text(`Kelas: ${selectedKelas}`, 14, 40);
    }
    
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: selectedKelas !== 'ALL' ? 45 : 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    doc.save(`${filename}.pdf`);
    
    toast({
      title: "Berhasil Export",
      description: `Data berhasil diexport ke ${filename}.pdf`
    });
  };

  const getFilteredData = <T extends { Kelas: string }>(data: T[] | undefined): T[] => {
    if (!data) return [];
    if (selectedKelas === 'ALL') return data;
    return data.filter(item => item.Kelas === selectedKelas);
  };

  const filteredHafalanData = getFilteredData(hafalanData);
  const filteredMurojaahData = getFilteredData(murojaahData);
  const filteredPenambahanData = getFilteredData(penambahanData);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Perkembangan Santri</h1>
        <p className="text-muted-foreground mt-2">
          Pantau hafalan dan murojaah santri per bulan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="month-filter">Bulan</Label>
          <Input
            id="month-filter"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            data-testid="input-month-filter"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="marhalah-filter">Filter Marhalah</Label>
          <Select value={selectedMarhalah} onValueChange={setSelectedMarhalah}>
            <SelectTrigger id="marhalah-filter" data-testid="select-marhalah-filter">
              <SelectValue placeholder="Semua Marhalah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              {lookups?.marhalah.filter(m => m.MarhalahID !== 'JAM').map((m) => (
                <SelectItem key={m.MarhalahID} value={m.MarhalahID}>
                  {m.NamaMarhalah}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="kelas-filter">Filter Kelas</Label>
          <Select value={selectedKelas} onValueChange={setSelectedKelas}>
            <SelectTrigger id="kelas-filter" data-testid="select-kelas-filter">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              {Array.from(new Set(
                (lookups?.kelas || [])
                  .filter(k => selectedMarhalah === 'ALL' || k.MarhalahID === selectedMarhalah)
                  .map(k => k.Kelas)
              )).map((kelas) => (
                <SelectItem key={kelas} value={kelas}>
                  {kelas}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="hafalan" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hafalan" data-testid="tab-hafalan">
            Hafalan Bulanan
          </TabsTrigger>
          <TabsTrigger value="murojaah" data-testid="tab-murojaah">
            Murojaah Bulanan
          </TabsTrigger>
          <TabsTrigger value="penambahan" data-testid="tab-penambahan">
            Penambahan Hafalan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hafalan" className="space-y-4">
          <div className="flex flex-wrap justify-end gap-2">
            <input
              ref={hafalanFileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleCSVUpload(file, 'hafalan');
                  e.target.value = '';
                }
              }}
              data-testid="input-file-hafalan"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => hafalanFileRef.current?.click()}
              disabled={batchUploadHafalanMutation.isPending}
              data-testid="button-upload-hafalan"
            >
              <Upload className="h-4 w-4 mr-2" />
              {batchUploadHafalanMutation.isPending ? 'Uploading...' : 'Upload CSV'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel(filteredHafalanData, `hafalan-bulanan-${selectedMonth}`, 'hafalan')}
              disabled={!filteredHafalanData || filteredHafalanData.length === 0}
              data-testid="button-export-excel-hafalan"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPDF(filteredHafalanData, `hafalan-bulanan-${selectedMonth}`, 'hafalan')}
              disabled={!filteredHafalanData || filteredHafalanData.length === 0}
              data-testid="button-export-pdf-hafalan"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                resetHafalanForm();
                setAddingHafalan(true);
              }} 
              disabled={addingHafalan}
              data-testid="button-add-hafalan"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Data
            </Button>
          </div>
          
          {loadingHafalan ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Data Hafalan Bulanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bulan</TableHead>
                        <TableHead>Nama Santri</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Marhalah</TableHead>
                        <TableHead>Halaqah</TableHead>
                        <TableHead>Musammi</TableHead>
                        <TableHead>Hafalan (Juz)</TableHead>
                        {addingHafalan && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addingHafalan && (
                        <TableRow className="bg-muted/50" data-testid="row-hafalan-new">
                          <TableCell>
                            <Input
                              type="month"
                              value={hafalanForm.Bulan}
                              onChange={(e) => setHafalanForm({ ...hafalanForm, Bulan: e.target.value })}
                              className="w-32"
                              data-testid="input-bulan-hafalan"
                            />
                          </TableCell>
                          <TableCell>
                            <Select value={hafalanForm.SantriID} onValueChange={(v) => handleSantriChange(v, 'hafalan')}>
                              <SelectTrigger className="w-40" data-testid="select-santri-hafalan">
                                <SelectValue placeholder="Pilih Santri" />
                              </SelectTrigger>
                              <SelectContent>
                                {allSantri?.filter(s => s.Aktif).map((s) => (
                                  <SelectItem key={s.SantriID} value={s.SantriID}>
                                    {s.NamaSantri}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {hafalanForm.Kelas || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {lookups?.marhalah.find(m => m.MarhalahID === hafalanForm.MarhalahID)?.NamaMarhalah || '-'}
                          </TableCell>
                          <TableCell>
                            <Select value={hafalanForm.HalaqahID} onValueChange={(v) => handleHalaqahChange(v, 'hafalan')}>
                              <SelectTrigger className="w-32" data-testid="select-halaqah-hafalan">
                                <SelectValue placeholder="Pilih Halaqah" />
                              </SelectTrigger>
                              <SelectContent>
                                {allHalaqah?.filter(h => h.MarhalahID === hafalanForm.MarhalahID).map((h) => {
                                  const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                                  return (
                                    <SelectItem key={h.HalaqahID} value={h.HalaqahID}>
                                      {h.NomorUrutHalaqah} - {musammi?.NamaMusammi}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {allMusammi?.find(m => m.MusammiID === hafalanForm.MusammiID)?.NamaMusammi || '-'}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.1"
                              value={hafalanForm.JumlahHafalan}
                              onChange={(e) => setHafalanForm({ ...hafalanForm, JumlahHafalan: parseFloat(e.target.value) || 0 })}
                              className="w-20"
                              data-testid="input-jumlah-hafalan"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => createHafalanMutation.mutate(hafalanForm)}
                                disabled={createHafalanMutation.isPending || !hafalanForm.SantriID || !hafalanForm.HalaqahID}
                                data-testid="button-save-hafalan"
                              >
                                {createHafalanMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAddingHafalan(false);
                                  resetHafalanForm();
                                }}
                                data-testid="button-cancel-hafalan"
                              >
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredHafalanData && filteredHafalanData.length > 0 ? (
                        filteredHafalanData.map((h) => {
                          const santri = allSantri?.find(s => s.SantriID === h.SantriID);
                          const halaqah = allHalaqah?.find(ha => ha.HalaqahID === h.HalaqahID);
                          const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                          return (
                            <TableRow key={h.RekapID} data-testid={`row-hafalan-${h.RekapID}`}>
                              <TableCell>{h.Bulan}</TableCell>
                              <TableCell className="font-medium">{santri?.NamaSantri || 'N/A'}</TableCell>
                              <TableCell>{h.Kelas}</TableCell>
                              <TableCell>{lookups?.marhalah.find(m => m.MarhalahID === h.MarhalahID)?.NamaMarhalah}</TableCell>
                              <TableCell>{halaqah?.NomorUrutHalaqah || 'N/A'}</TableCell>
                              <TableCell>{musammi?.NamaMusammi || 'N/A'}</TableCell>
                              <TableCell className="font-mono">{h.JumlahHafalan.toFixed(1)}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : !addingHafalan ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Tidak ada data hafalan untuk bulan {selectedMonth}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="murojaah" className="space-y-4">
          <div className="flex flex-wrap justify-end gap-2">
            <input
              ref={murojaahFileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleCSVUpload(file, 'murojaah');
                  e.target.value = '';
                }
              }}
              data-testid="input-file-murojaah"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => murojaahFileRef.current?.click()}
              disabled={batchUploadMurojaahMutation.isPending}
              data-testid="button-upload-murojaah"
            >
              <Upload className="h-4 w-4 mr-2" />
              {batchUploadMurojaahMutation.isPending ? 'Uploading...' : 'Upload CSV'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel(filteredMurojaahData, `murojaah-bulanan-${selectedMonth}`, 'murojaah')}
              disabled={!filteredMurojaahData || filteredMurojaahData.length === 0}
              data-testid="button-export-excel-murojaah"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPDF(filteredMurojaahData, `murojaah-bulanan-${selectedMonth}`, 'murojaah')}
              disabled={!filteredMurojaahData || filteredMurojaahData.length === 0}
              data-testid="button-export-pdf-murojaah"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                resetMurojaahForm();
                setAddingMurojaah(true);
              }}
              disabled={addingMurojaah}
              data-testid="button-add-murojaah"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Data
            </Button>
          </div>
          
          {loadingMurojaah ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Data Murojaah Bulanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bulan</TableHead>
                        <TableHead>Nama Santri</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Marhalah</TableHead>
                        <TableHead>Halaqah</TableHead>
                        <TableHead>Musammi</TableHead>
                        <TableHead>Murojaah (Juz)</TableHead>
                        {addingMurojaah && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addingMurojaah && (
                        <TableRow className="bg-muted/50" data-testid="row-murojaah-new">
                          <TableCell>
                            <Input
                              type="month"
                              value={murojaahForm.Bulan}
                              onChange={(e) => setMurojaahForm({ ...murojaahForm, Bulan: e.target.value })}
                              className="w-32"
                              data-testid="input-bulan-murojaah"
                            />
                          </TableCell>
                          <TableCell>
                            <Select value={murojaahForm.SantriID} onValueChange={(v) => handleSantriChange(v, 'murojaah')}>
                              <SelectTrigger className="w-40" data-testid="select-santri-murojaah">
                                <SelectValue placeholder="Pilih Santri" />
                              </SelectTrigger>
                              <SelectContent>
                                {allSantri?.filter(s => s.Aktif).map((s) => (
                                  <SelectItem key={s.SantriID} value={s.SantriID}>
                                    {s.NamaSantri}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {murojaahForm.Kelas || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {lookups?.marhalah.find(m => m.MarhalahID === murojaahForm.MarhalahID)?.NamaMarhalah || '-'}
                          </TableCell>
                          <TableCell>
                            <Select value={murojaahForm.HalaqahID} onValueChange={(v) => handleHalaqahChange(v, 'murojaah')}>
                              <SelectTrigger className="w-32" data-testid="select-halaqah-murojaah">
                                <SelectValue placeholder="Pilih Halaqah" />
                              </SelectTrigger>
                              <SelectContent>
                                {allHalaqah?.filter(h => h.MarhalahID === murojaahForm.MarhalahID).map((h) => {
                                  const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                                  return (
                                    <SelectItem key={h.HalaqahID} value={h.HalaqahID}>
                                      {h.NomorUrutHalaqah} - {musammi?.NamaMusammi}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {allMusammi?.find(m => m.MusammiID === murojaahForm.MusammiID)?.NamaMusammi || '-'}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.1"
                              value={murojaahForm.JumlahMurojaah}
                              onChange={(e) => setMurojaahForm({ ...murojaahForm, JumlahMurojaah: parseFloat(e.target.value) || 0 })}
                              className="w-20"
                              data-testid="input-jumlah-murojaah"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => createMurojaahMutation.mutate(murojaahForm)}
                                disabled={createMurojaahMutation.isPending || !murojaahForm.SantriID || !murojaahForm.HalaqahID}
                                data-testid="button-save-murojaah"
                              >
                                {createMurojaahMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAddingMurojaah(false);
                                  resetMurojaahForm();
                                }}
                                data-testid="button-cancel-murojaah"
                              >
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredMurojaahData && filteredMurojaahData.length > 0 ? (
                        filteredMurojaahData.map((m) => {
                          const santri = allSantri?.find(s => s.SantriID === m.SantriID);
                          const halaqah = allHalaqah?.find(ha => ha.HalaqahID === m.HalaqahID);
                          const musammi = allMusammi?.find(mu => mu.MusammiID === m.MusammiID);
                          return (
                            <TableRow key={m.MurojaahID} data-testid={`row-murojaah-${m.MurojaahID}`}>
                              <TableCell>{m.Bulan}</TableCell>
                              <TableCell className="font-medium">{santri?.NamaSantri || 'N/A'}</TableCell>
                              <TableCell>{m.Kelas}</TableCell>
                              <TableCell>{lookups?.marhalah.find(mar => mar.MarhalahID === m.MarhalahID)?.NamaMarhalah}</TableCell>
                              <TableCell>{halaqah?.NomorUrutHalaqah || 'N/A'}</TableCell>
                              <TableCell>{musammi?.NamaMusammi || 'N/A'}</TableCell>
                              <TableCell className="font-mono">{m.JumlahMurojaah.toFixed(1)}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : !addingMurojaah ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Tidak ada data murojaah untuk bulan {selectedMonth}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="penambahan" className="space-y-4">
          <div className="flex flex-wrap justify-end gap-2">
            <input
              ref={penambahanFileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleCSVUpload(file, 'penambahan');
                  e.target.value = '';
                }
              }}
              data-testid="input-file-penambahan"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => penambahanFileRef.current?.click()}
              disabled={batchUploadPenambahanMutation.isPending}
              data-testid="button-upload-penambahan"
            >
              <Upload className="h-4 w-4 mr-2" />
              {batchUploadPenambahanMutation.isPending ? 'Uploading...' : 'Upload CSV'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel(filteredPenambahanData, `penambahan-hafalan-${selectedMonth}`, 'penambahan')}
              disabled={!filteredPenambahanData || filteredPenambahanData.length === 0}
              data-testid="button-export-excel-penambahan"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPDF(filteredPenambahanData, `penambahan-hafalan-${selectedMonth}`, 'penambahan')}
              disabled={!filteredPenambahanData || filteredPenambahanData.length === 0}
              data-testid="button-export-pdf-penambahan"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                resetPenambahanForm();
                setAddingPenambahan(true);
              }}
              disabled={addingPenambahan}
              data-testid="button-add-penambahan"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Tambah Data
            </Button>
          </div>
          
          {loadingPenambahan ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Data Penambahan Hafalan</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Input penambahan hafalan dalam format halaman. Sistem akan otomatis mengonversi ke juz
                  (20 halaman = 1 juz) dan menambahkannya ke data hafalan bulanan.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bulan</TableHead>
                        <TableHead>Nama Santri</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Marhalah</TableHead>
                        <TableHead>Halaqah</TableHead>
                        <TableHead>Musammi</TableHead>
                        <TableHead>Penambahan (Halaman)</TableHead>
                        <TableHead>Penambahan (Juz)</TableHead>
                        <TableHead>Catatan</TableHead>
                        {addingPenambahan && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addingPenambahan && (
                        <TableRow className="bg-muted/50" data-testid="row-penambahan-new">
                          <TableCell>
                            <Input
                              type="month"
                              value={penambahanForm.Bulan}
                              onChange={(e) => setPenambahanForm({ ...penambahanForm, Bulan: e.target.value })}
                              className="w-32"
                              data-testid="input-bulan-penambahan"
                            />
                          </TableCell>
                          <TableCell>
                            <Select value={penambahanForm.SantriID} onValueChange={(v) => handleSantriChange(v, 'penambahan')}>
                              <SelectTrigger className="w-40" data-testid="select-santri-penambahan">
                                <SelectValue placeholder="Pilih Santri" />
                              </SelectTrigger>
                              <SelectContent>
                                {allSantri?.filter(s => s.Aktif).map((s) => (
                                  <SelectItem key={s.SantriID} value={s.SantriID}>
                                    {s.NamaSantri}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {penambahanForm.Kelas || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {lookups?.marhalah.find(m => m.MarhalahID === penambahanForm.MarhalahID)?.NamaMarhalah || '-'}
                          </TableCell>
                          <TableCell>
                            <Select value={penambahanForm.HalaqahID} onValueChange={(v) => handleHalaqahChange(v, 'penambahan')}>
                              <SelectTrigger className="w-32" data-testid="select-halaqah-penambahan">
                                <SelectValue placeholder="Pilih Halaqah" />
                              </SelectTrigger>
                              <SelectContent>
                                {allHalaqah?.filter(h => h.MarhalahID === penambahanForm.MarhalahID).map((h) => {
                                  const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                                  return (
                                    <SelectItem key={h.HalaqahID} value={h.HalaqahID}>
                                      {h.NomorUrutHalaqah} - {musammi?.NamaMusammi}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {allMusammi?.find(m => m.MusammiID === penambahanForm.MusammiID)?.NamaMusammi || '-'}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="1"
                              value={penambahanForm.JumlahPenambahan}
                              onChange={(e) => setPenambahanForm({ ...penambahanForm, JumlahPenambahan: parseInt(e.target.value) || 0 })}
                              className="w-20"
                              data-testid="input-jumlah-penambahan"
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {(penambahanForm.JumlahPenambahan / 20).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={penambahanForm.Catatan || ''}
                              onChange={(e) => setPenambahanForm({ ...penambahanForm, Catatan: e.target.value })}
                              className="w-32"
                              placeholder="Optional"
                              data-testid="input-catatan-penambahan"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => createPenambahanMutation.mutate(penambahanForm)}
                                disabled={createPenambahanMutation.isPending || !penambahanForm.SantriID || !penambahanForm.HalaqahID}
                                data-testid="button-save-penambahan"
                              >
                                {createPenambahanMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAddingPenambahan(false);
                                  resetPenambahanForm();
                                }}
                                data-testid="button-cancel-penambahan"
                              >
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredPenambahanData && filteredPenambahanData.length > 0 ? (
                        filteredPenambahanData.map((p) => {
                          const santri = allSantri?.find(s => s.SantriID === p.SantriID);
                          const halaqah = allHalaqah?.find(ha => ha.HalaqahID === p.HalaqahID);
                          const musammi = allMusammi?.find(m => m.MusammiID === p.MusammiID);
                          const juz = (p.JumlahPenambahan / 20).toFixed(2);
                          return (
                            <TableRow key={p.PenambahanID} data-testid={`row-penambahan-${p.PenambahanID}`}>
                              <TableCell>{p.Bulan}</TableCell>
                              <TableCell className="font-medium">{santri?.NamaSantri || 'N/A'}</TableCell>
                              <TableCell>{p.Kelas}</TableCell>
                              <TableCell>{lookups?.marhalah.find(m => m.MarhalahID === p.MarhalahID)?.NamaMarhalah}</TableCell>
                              <TableCell>{halaqah?.NomorUrutHalaqah || 'N/A'}</TableCell>
                              <TableCell>{musammi?.NamaMusammi || 'N/A'}</TableCell>
                              <TableCell className="font-mono">{p.JumlahPenambahan}</TableCell>
                              <TableCell className="font-mono">{juz}</TableCell>
                              <TableCell>{p.Catatan || '-'}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : !addingPenambahan ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground">
                            Tidak ada data penambahan hafalan untuk bulan {selectedMonth}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
