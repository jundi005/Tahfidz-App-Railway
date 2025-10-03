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
import { Plus, TrendingUp, Upload, Download, FileSpreadsheet, FileText, HelpCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

type HafalanRow = InsertHafalanBulanan & { id: string; halaqahMembers: HalaqahMembers[] };
type MurojaahRow = InsertMurojaahBulanan & { id: string; halaqahMembers: HalaqahMembers[] };
type PenambahanRow = InsertPenambahanHafalan & { id: string; halaqahMembers: HalaqahMembers[] };

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

  // Forms for new rows - now arrays to support multiple rows
  const [hafalanRows, setHafalanRows] = useState<HafalanRow[]>([]);
  const [murojaahRows, setMurojaahRows] = useState<MurojaahRow[]>([]);
  const [penambahanRows, setPenambahanRows] = useState<PenambahanRow[]>([]);

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

  // Helper functions for managing rows
  const createNewHafalanRow = (): HafalanRow => ({
    id: `hafalan-${Date.now()}-${Math.random()}`,
    Bulan: selectedMonth,
    SantriID: '',
    HalaqahID: '',
    MarhalahID: 'MUT',
    Kelas: '',
    MusammiID: '',
    JumlahHafalan: 0,
    halaqahMembers: []
  });

  const createNewMurojaahRow = (): MurojaahRow => ({
    id: `murojaah-${Date.now()}-${Math.random()}`,
    Bulan: selectedMonth,
    SantriID: '',
    HalaqahID: '',
    MarhalahID: 'MUT',
    Kelas: '',
    MusammiID: '',
    JumlahMurojaah: 0,
    halaqahMembers: []
  });

  const createNewPenambahanRow = (): PenambahanRow => ({
    id: `penambahan-${Date.now()}-${Math.random()}`,
    Bulan: selectedMonth,
    SantriID: '',
    HalaqahID: '',
    MarhalahID: 'MUT',
    Kelas: '',
    MusammiID: '',
    JumlahPenambahan: 0,
    Catatan: '',
    halaqahMembers: []
  });

  const addHafalanRow = () => {
    setHafalanRows([...hafalanRows, createNewHafalanRow()]);
  };

  const addMurojaahRow = () => {
    setMurojaahRows([...murojaahRows, createNewMurojaahRow()]);
  };

  const addPenambahanRow = () => {
    setPenambahanRows([...penambahanRows, createNewPenambahanRow()]);
  };

  const removeHafalanRow = (id: string) => {
    setHafalanRows(hafalanRows.filter(row => row.id !== id));
  };

  const removeMurojaahRow = (id: string) => {
    setMurojaahRows(murojaahRows.filter(row => row.id !== id));
  };

  const removePenambahanRow = (id: string) => {
    setPenambahanRows(penambahanRows.filter(row => row.id !== id));
  };

  const updateHafalanRow = (id: string, field: keyof Omit<HafalanRow, 'id'>, value: any) => {
    setHafalanRows(hafalanRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const updateMurojaahRow = (id: string, field: keyof Omit<MurojaahRow, 'id'>, value: any) => {
    setMurojaahRows(murojaahRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const updatePenambahanRow = (id: string, field: keyof Omit<PenambahanRow, 'id'>, value: any) => {
    setPenambahanRows(penambahanRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

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
        description: `${result.count} data hafalan berhasil ditambahkan`,
        duration: 5000
      });
      setAddingHafalan(false);
      resetHafalanRows();
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
        description: `${result.count} data murojaah berhasil ditambahkan`,
        duration: 5000
      });
      setAddingMurojaah(false);
      resetMurojaahRows();
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
        description: `${result.count} data penambahan hafalan berhasil ditambahkan dan hafalan bulanan diperbarui`,
        duration: 5000
      });
      setAddingPenambahan(false);
      resetPenambahanRows();
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
            if (val === null || val === undefined) return defaultVal;
            const str = val.toString().trim();
            return str === '' ? defaultVal : str;
          };
          
          const normalizeMarhalah = (val: any): "MUT" | "ALI" | "JAM" => {
            const normalized = normalizeString(val, 'MUT').toUpperCase();
            if (normalized === 'ALI' || normalized === 'JAM') return normalized as "MUT" | "ALI" | "JAM";
            return 'MUT';
          };
          
          const findValue = (row: any, possibleKeys: string[]): any => {
            for (const key of possibleKeys) {
              if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                return row[key];
              }
            }
            return '';
          };
          
          if (type === 'hafalan') {
            const validRows: InsertHafalanBulanan[] = [];
            const warnings: string[] = [];
            
            data.forEach((row, index) => {
              const santriId = normalizeString(findValue(row, [
                'SantriID', 'santriId', 'santri_id', 'Santri', 'santri', 'NamaSantri', 'nama_santri'
              ]));
              const halaqahId = normalizeString(findValue(row, [
                'HalaqahID', 'halaqahId', 'halaqah_id', 'Halaqah', 'halaqah', 'NomorHalaqah', 'nomor_halaqah'
              ]));
              
              if (!santriId) {
                warnings.push(`Baris ${index + 2}: SantriID kosong`);
              }
              if (!halaqahId) {
                warnings.push(`Baris ${index + 2}: HalaqahID kosong`);
              }
              
              if (!santriId || !halaqahId) {
                return;
              }
              
              const bulan = normalizeString(findValue(row, [
                'Bulan', 'bulan', 'Month', 'month', 'Tanggal', 'tanggal'
              ]), selectedMonth);
              const jumlah = parseNumber(findValue(row, [
                'JumlahHafalan', 'jumlahHafalan', 'jumlah_hafalan', 'Hafalan', 'hafalan', 'Jumlah', 'jumlah'
              ]));
              
              validRows.push({
                Bulan: bulan,
                SantriID: santriId,
                HalaqahID: halaqahId,
                MarhalahID: normalizeMarhalah(findValue(row, [
                  'MarhalahID', 'marhalahId', 'marhalah_id', 'Marhalah', 'marhalah'
                ])),
                Kelas: normalizeString(findValue(row, [
                  'Kelas', 'kelas', 'Class', 'class'
                ])),
                MusammiID: normalizeString(findValue(row, [
                  'MusammiID', 'musammiId', 'musammi_id', 'Musammi', 'musammi', 'NamaMusammi', 'nama_musammi'
                ])),
                JumlahHafalan: jumlah
              });
            });
            
            if (validRows.length === 0) {
              const errorMsg = warnings.length > 0 
                ? `Tidak ada data valid. ${warnings.slice(0, 3).join('; ')}${warnings.length > 3 ? '...' : ''}. Pastikan CSV memiliki kolom: SantriID, HalaqahID, JumlahHafalan` 
                : "Tidak ada data yang bisa diimport dari CSV. Pastikan CSV memiliki kolom: SantriID, HalaqahID, JumlahHafalan";
              
              toast({ 
                title: "Tidak Ada Data Valid", 
                description: errorMsg, 
                variant: "destructive",
                duration: 10000
              });
              return;
            }
            
            if (warnings.length > 0) {
              toast({
                title: `Berhasil Import ${validRows.length} Data`,
                description: `${warnings.length} baris dilewati karena data tidak lengkap`,
                duration: 5000
              });
            }
            
            batchUploadHafalanMutation.mutate(validRows);
          } else if (type === 'murojaah') {
            const validRows: InsertMurojaahBulanan[] = [];
            const warnings: string[] = [];
            
            data.forEach((row, index) => {
              const santriId = normalizeString(findValue(row, [
                'SantriID', 'santriId', 'santri_id', 'Santri', 'santri', 'NamaSantri', 'nama_santri'
              ]));
              const halaqahId = normalizeString(findValue(row, [
                'HalaqahID', 'halaqahId', 'halaqah_id', 'Halaqah', 'halaqah', 'NomorHalaqah', 'nomor_halaqah'
              ]));
              
              if (!santriId) {
                warnings.push(`Baris ${index + 2}: SantriID kosong`);
              }
              if (!halaqahId) {
                warnings.push(`Baris ${index + 2}: HalaqahID kosong`);
              }
              
              if (!santriId || !halaqahId) {
                return;
              }
              
              const bulan = normalizeString(findValue(row, [
                'Bulan', 'bulan', 'Month', 'month', 'Tanggal', 'tanggal'
              ]), selectedMonth);
              const jumlah = parseNumber(findValue(row, [
                'JumlahMurojaah', 'jumlahMurojaah', 'jumlah_murojaah', 'Murojaah', 'murojaah', 'Jumlah', 'jumlah'
              ]));
              
              validRows.push({
                Bulan: bulan,
                SantriID: santriId,
                HalaqahID: halaqahId,
                MarhalahID: normalizeMarhalah(findValue(row, [
                  'MarhalahID', 'marhalahId', 'marhalah_id', 'Marhalah', 'marhalah'
                ])),
                Kelas: normalizeString(findValue(row, [
                  'Kelas', 'kelas', 'Class', 'class'
                ])),
                MusammiID: normalizeString(findValue(row, [
                  'MusammiID', 'musammiId', 'musammi_id', 'Musammi', 'musammi', 'NamaMusammi', 'nama_musammi'
                ])),
                JumlahMurojaah: jumlah
              });
            });
            
            if (validRows.length === 0) {
              const errorMsg = warnings.length > 0 
                ? `Tidak ada data valid. ${warnings.slice(0, 3).join('; ')}${warnings.length > 3 ? '...' : ''}. Pastikan CSV memiliki kolom: SantriID, HalaqahID, JumlahMurojaah` 
                : "Tidak ada data yang bisa diimport dari CSV. Pastikan CSV memiliki kolom: SantriID, HalaqahID, JumlahMurojaah";
              
              toast({ 
                title: "Tidak Ada Data Valid", 
                description: errorMsg, 
                variant: "destructive",
                duration: 10000
              });
              return;
            }
            
            if (warnings.length > 0) {
              toast({
                title: `Berhasil Import ${validRows.length} Data`,
                description: `${warnings.length} baris dilewati karena data tidak lengkap`,
                duration: 5000
              });
            }
            
            batchUploadMurojaahMutation.mutate(validRows);
          } else {
            const validRows: InsertPenambahanHafalan[] = [];
            const warnings: string[] = [];
            
            data.forEach((row, index) => {
              const santriId = normalizeString(findValue(row, [
                'SantriID', 'santriId', 'santri_id', 'Santri', 'santri', 'NamaSantri', 'nama_santri'
              ]));
              const halaqahId = normalizeString(findValue(row, [
                'HalaqahID', 'halaqahId', 'halaqah_id', 'Halaqah', 'halaqah', 'NomorHalaqah', 'nomor_halaqah'
              ]));
              
              if (!santriId) {
                warnings.push(`Baris ${index + 2}: SantriID kosong`);
              }
              if (!halaqahId) {
                warnings.push(`Baris ${index + 2}: HalaqahID kosong`);
              }
              
              if (!santriId || !halaqahId) {
                return;
              }
              
              const bulan = normalizeString(findValue(row, [
                'Bulan', 'bulan', 'Month', 'month', 'Tanggal', 'tanggal'
              ]), selectedMonth);
              const jumlah = parseNumber(findValue(row, [
                'JumlahPenambahan', 'jumlahPenambahan', 'jumlah_penambahan', 'Penambahan', 'penambahan', 'Halaman', 'halaman', 'Jumlah', 'jumlah'
              ]));
              
              validRows.push({
                Bulan: bulan,
                SantriID: santriId,
                HalaqahID: halaqahId,
                MarhalahID: normalizeMarhalah(findValue(row, [
                  'MarhalahID', 'marhalahId', 'marhalah_id', 'Marhalah', 'marhalah'
                ])),
                Kelas: normalizeString(findValue(row, [
                  'Kelas', 'kelas', 'Class', 'class'
                ])),
                MusammiID: normalizeString(findValue(row, [
                  'MusammiID', 'musammiId', 'musammi_id', 'Musammi', 'musammi', 'NamaMusammi', 'nama_musammi'
                ])),
                JumlahPenambahan: Math.round(jumlah),
                Catatan: normalizeString(findValue(row, [
                  'Catatan', 'catatan', 'Notes', 'notes', 'Keterangan', 'keterangan'
                ]))
              });
            });
            
            if (validRows.length === 0) {
              const errorMsg = warnings.length > 0 
                ? `Tidak ada data valid. ${warnings.slice(0, 3).join('; ')}${warnings.length > 3 ? '...' : ''}. Pastikan CSV memiliki kolom: SantriID, HalaqahID, JumlahPenambahan` 
                : "Tidak ada data yang bisa diimport dari CSV. Pastikan CSV memiliki kolom: SantriID, HalaqahID, JumlahPenambahan";
              
              toast({ 
                title: "Tidak Ada Data Valid", 
                description: errorMsg, 
                variant: "destructive",
                duration: 10000
              });
              return;
            }
            
            if (warnings.length > 0) {
              toast({
                title: `Berhasil Import ${validRows.length} Data`,
                description: `${warnings.length} baris dilewati karena data tidak lengkap`,
                duration: 5000
              });
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

  const resetHafalanRows = () => {
    setHafalanRows([]);
  };

  const resetMurojaahRows = () => {
    setMurojaahRows([]);
  };

  const resetPenambahanRows = () => {
    setPenambahanRows([]);
  };

  // Handler for Marhalah change - filters Halaqah dropdown
  const handleMarhalahChange = async (rowId: string, marhalahId: string, formType: 'hafalan' | 'murojaah' | 'penambahan') => {
    if (formType === 'hafalan') {
      updateHafalanRow(rowId, 'MarhalahID', marhalahId as 'MUT' | 'ALI' | 'JAM');
      updateHafalanRow(rowId, 'HalaqahID', '');
      updateHafalanRow(rowId, 'SantriID', '');
      updateHafalanRow(rowId, 'MusammiID', '');
      updateHafalanRow(rowId, 'Kelas', '');
      updateHafalanRow(rowId, 'halaqahMembers', []);
    } else if (formType === 'murojaah') {
      updateMurojaahRow(rowId, 'MarhalahID', marhalahId as 'MUT' | 'ALI' | 'JAM');
      updateMurojaahRow(rowId, 'HalaqahID', '');
      updateMurojaahRow(rowId, 'SantriID', '');
      updateMurojaahRow(rowId, 'MusammiID', '');
      updateMurojaahRow(rowId, 'Kelas', '');
      updateMurojaahRow(rowId, 'halaqahMembers', []);
    } else {
      updatePenambahanRow(rowId, 'MarhalahID', marhalahId as 'MUT' | 'ALI' | 'JAM');
      updatePenambahanRow(rowId, 'HalaqahID', '');
      updatePenambahanRow(rowId, 'SantriID', '');
      updatePenambahanRow(rowId, 'MusammiID', '');
      updatePenambahanRow(rowId, 'Kelas', '');
      updatePenambahanRow(rowId, 'halaqahMembers', []);
    }
  };

  // Handler for Halaqah change - fetches members and filters Santri dropdown
  const handleHalaqahChange = async (rowId: string, halaqahId: string, formType: 'hafalan' | 'murojaah' | 'penambahan') => {
    const halaqah = allHalaqah?.find(h => h.HalaqahID === halaqahId);
    if (!halaqah) return;

    try {
      const response = await fetch(`/api/halaqah-members?halaqahId=${halaqahId}`);
      if (!response.ok) throw new Error('Failed to fetch halaqah members');
      const members: HalaqahMembers[] = await response.json();

      if (formType === 'hafalan') {
        updateHafalanRow(rowId, 'HalaqahID', halaqahId);
        updateHafalanRow(rowId, 'MusammiID', halaqah.MusammiID);
        updateHafalanRow(rowId, 'SantriID', '');
        updateHafalanRow(rowId, 'Kelas', '');
        updateHafalanRow(rowId, 'halaqahMembers', members);
      } else if (formType === 'murojaah') {
        updateMurojaahRow(rowId, 'HalaqahID', halaqahId);
        updateMurojaahRow(rowId, 'MusammiID', halaqah.MusammiID);
        updateMurojaahRow(rowId, 'SantriID', '');
        updateMurojaahRow(rowId, 'Kelas', '');
        updateMurojaahRow(rowId, 'halaqahMembers', members);
      } else {
        updatePenambahanRow(rowId, 'HalaqahID', halaqahId);
        updatePenambahanRow(rowId, 'MusammiID', halaqah.MusammiID);
        updatePenambahanRow(rowId, 'SantriID', '');
        updatePenambahanRow(rowId, 'Kelas', '');
        updatePenambahanRow(rowId, 'halaqahMembers', members);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil data anggota halaqah",
        variant: "destructive"
      });
    }
  };

  // Handler for Santri change - auto-fills Kelas
  const handleSantriChange = (rowId: string, santriId: string, formType: 'hafalan' | 'murojaah' | 'penambahan') => {
    const santri = allSantri?.find(s => s.SantriID === santriId);
    if (!santri) return;

    if (formType === 'hafalan') {
      updateHafalanRow(rowId, 'SantriID', santriId);
      updateHafalanRow(rowId, 'Kelas', santri.Kelas);
    } else if (formType === 'murojaah') {
      updateMurojaahRow(rowId, 'SantriID', santriId);
      updateMurojaahRow(rowId, 'Kelas', santri.Kelas);
    } else {
      updatePenambahanRow(rowId, 'SantriID', santriId);
      updatePenambahanRow(rowId, 'Kelas', santri.Kelas);
    }
  };

  // Handler for batch save
  const handleSaveHafalanRows = () => {
    const validRows = hafalanRows.filter(row => 
      row.SantriID && row.HalaqahID && row.MarhalahID && row.JumlahHafalan > 0
    );
    
    if (validRows.length === 0) {
      toast({
        title: "Tidak Ada Data",
        description: "Lengkapi setidaknya satu baris data dengan benar",
        variant: "destructive"
      });
      return;
    }

    const dataToSave = validRows.map(({ id, halaqahMembers, ...rest }) => rest);
    batchUploadHafalanMutation.mutate(dataToSave);
  };

  const handleSaveMurojaahRows = () => {
    const validRows = murojaahRows.filter(row => 
      row.SantriID && row.HalaqahID && row.MarhalahID && row.JumlahMurojaah > 0
    );
    
    if (validRows.length === 0) {
      toast({
        title: "Tidak Ada Data",
        description: "Lengkapi setidaknya satu baris data dengan benar",
        variant: "destructive"
      });
      return;
    }

    const dataToSave = validRows.map(({ id, halaqahMembers, ...rest }) => rest);
    batchUploadMurojaahMutation.mutate(dataToSave);
  };

  const handleSavePenambahanRows = () => {
    const validRows = penambahanRows.filter(row => 
      row.SantriID && row.HalaqahID && row.MarhalahID && row.JumlahPenambahan > 0
    );
    
    if (validRows.length === 0) {
      toast({
        title: "Tidak Ada Data",
        description: "Lengkapi setidaknya satu baris data dengan benar",
        variant: "destructive"
      });
      return;
    }

    const dataToSave = validRows.map(({ id, halaqahMembers, ...rest }) => rest);
    batchUploadPenambahanMutation.mutate(dataToSave);
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
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Format CSV yang diperlukan:</p>
                <p className="text-xs">Kolom wajib: SantriID, HalaqahID, JumlahHafalan</p>
                <p className="text-xs">Opsional: Bulan, MarhalahID, Kelas, MusammiID</p>
              </TooltipContent>
            </Tooltip>
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
                setHafalanRows([createNewHafalanRow()]);
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
                        <TableHead>Marhalah</TableHead>
                        <TableHead>Halaqah</TableHead>
                        <TableHead>Nama Santri</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Musammi</TableHead>
                        <TableHead>Hafalan (Juz)</TableHead>
                        {addingHafalan && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addingHafalan && hafalanRows.map((row) => (
                        <TableRow key={row.id} className="bg-muted/50" data-testid={`row-hafalan-new-${row.id}`}>
                          <TableCell>
                            <Input
                              type="month"
                              value={row.Bulan}
                              onChange={(e) => updateHafalanRow(row.id, 'Bulan', e.target.value)}
                              className="w-32"
                              data-testid={`input-bulan-hafalan-${row.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              key={`marhalah-${row.id}`}
                              value={row.MarhalahID} 
                              onValueChange={(v) => handleMarhalahChange(row.id, v, 'hafalan')}
                            >
                              <SelectTrigger className="w-32" data-testid={`select-marhalah-hafalan-${row.id}`}>
                                <SelectValue placeholder="Pilih Marhalah" />
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
                              key={`halaqah-${row.id}-${row.MarhalahID}`}
                              value={row.HalaqahID ? row.HalaqahID : undefined} 
                              onValueChange={(v) => handleHalaqahChange(row.id, v, 'hafalan')}
                              disabled={!row.MarhalahID}
                            >
                              <SelectTrigger className="w-32" data-testid={`select-halaqah-hafalan-${row.id}`}>
                                <SelectValue placeholder="Pilih Halaqah" />
                              </SelectTrigger>
                              <SelectContent>
                                {allHalaqah?.filter(h => h.MarhalahID === row.MarhalahID).length ? (
                                  allHalaqah.filter(h => h.MarhalahID === row.MarhalahID).map((h) => {
                                    const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                                    return (
                                      <SelectItem key={h.HalaqahID} value={h.HalaqahID}>
                                        {h.NomorUrutHalaqah} - {musammi?.NamaMusammi}
                                      </SelectItem>
                                    );
                                  })
                                ) : (
                                  <SelectItem value="__no_halaqah__" disabled>Tidak ada halaqah</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              key={`santri-${row.id}-${row.HalaqahID}`}
                              value={row.SantriID ? row.SantriID : undefined} 
                              onValueChange={(v) => handleSantriChange(row.id, v, 'hafalan')}
                              disabled={!row.HalaqahID || row.halaqahMembers.length === 0}
                            >
                              <SelectTrigger className="w-40" data-testid={`select-santri-hafalan-${row.id}`}>
                                <SelectValue placeholder="Pilih Santri" />
                              </SelectTrigger>
                              <SelectContent>
                                {row.halaqahMembers.length > 0 ? (
                                  row.halaqahMembers.map((member) => {
                                    const santri = allSantri?.find(s => s.SantriID === member.SantriID && s.Aktif);
                                    if (!santri) return null;
                                    return (
                                      <SelectItem key={santri.SantriID} value={santri.SantriID}>
                                        {santri.NamaSantri}
                                      </SelectItem>
                                    );
                                  }).filter(Boolean)
                                ) : (
                                  <SelectItem value="__no_santri__" disabled>
                                    Pilih Halaqah terlebih dahulu
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.Kelas || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {allMusammi?.find(m => m.MusammiID === row.MusammiID)?.NamaMusammi || '-'}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={row.JumlahHafalan}
                              onChange={(e) => updateHafalanRow(row.id, 'JumlahHafalan', parseFloat(e.target.value) || 0)}
                              className="w-20"
                              data-testid={`input-jumlah-hafalan-${row.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeHafalanRow(row.id)}
                                data-testid={`button-remove-hafalan-${row.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {addingHafalan && (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={addHafalanRow}
                                data-testid="button-add-row-hafalan"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Baris
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveHafalanRows}
                                disabled={batchUploadHafalanMutation.isPending || hafalanRows.length === 0}
                                data-testid="button-save-all-hafalan"
                              >
                                {batchUploadHafalanMutation.isPending ? 'Saving...' : `Simpan Semua (${hafalanRows.length})`}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAddingHafalan(false);
                                  resetHafalanRows();
                                }}
                                data-testid="button-cancel-hafalan"
                              >
                                Batal
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
                              <TableCell>{lookups?.marhalah.find(m => m.MarhalahID === h.MarhalahID)?.NamaMarhalah}</TableCell>
                              <TableCell>{halaqah?.NomorUrutHalaqah || 'N/A'}</TableCell>
                              <TableCell className="font-medium">{santri?.NamaSantri || 'N/A'}</TableCell>
                              <TableCell>{h.Kelas}</TableCell>
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
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Format CSV yang diperlukan:</p>
                <p className="text-xs">Kolom wajib: SantriID, HalaqahID, JumlahMurojaah</p>
                <p className="text-xs">Opsional: Bulan, MarhalahID, Kelas, MusammiID</p>
              </TooltipContent>
            </Tooltip>
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
                setMurojaahRows([createNewMurojaahRow()]);
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
                        <TableHead>Marhalah</TableHead>
                        <TableHead>Halaqah</TableHead>
                        <TableHead>Nama Santri</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Musammi</TableHead>
                        <TableHead>Murojaah (Juz)</TableHead>
                        {addingMurojaah && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addingMurojaah && murojaahRows.map((row) => (
                        <TableRow key={row.id} className="bg-muted/50" data-testid={`row-murojaah-new-${row.id}`}>
                          <TableCell>
                            <Input
                              type="month"
                              value={row.Bulan}
                              onChange={(e) => updateMurojaahRow(row.id, 'Bulan', e.target.value)}
                              className="w-32"
                              data-testid={`input-bulan-murojaah-${row.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              key={`marhalah-${row.id}`}
                              value={row.MarhalahID} 
                              onValueChange={(v) => handleMarhalahChange(row.id, v, 'murojaah')}
                            >
                              <SelectTrigger className="w-32" data-testid={`select-marhalah-murojaah-${row.id}`}>
                                <SelectValue placeholder="Pilih Marhalah" />
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
                              key={`halaqah-${row.id}-${row.MarhalahID}`}
                              value={row.HalaqahID ? row.HalaqahID : undefined} 
                              onValueChange={(v) => handleHalaqahChange(row.id, v, 'murojaah')}
                              disabled={!row.MarhalahID}
                            >
                              <SelectTrigger className="w-32" data-testid={`select-halaqah-murojaah-${row.id}`}>
                                <SelectValue placeholder="Pilih Halaqah" />
                              </SelectTrigger>
                              <SelectContent>
                                {allHalaqah?.filter(h => h.MarhalahID === row.MarhalahID).length ? (
                                  allHalaqah.filter(h => h.MarhalahID === row.MarhalahID).map((h) => {
                                    const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                                    return (
                                      <SelectItem key={h.HalaqahID} value={h.HalaqahID}>
                                        {h.NomorUrutHalaqah} - {musammi?.NamaMusammi}
                                      </SelectItem>
                                    );
                                  })
                                ) : (
                                  <SelectItem value="__no_halaqah__" disabled>Tidak ada halaqah</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              key={`santri-${row.id}-${row.HalaqahID}`}
                              value={row.SantriID ? row.SantriID : undefined} 
                              onValueChange={(v) => handleSantriChange(row.id, v, 'murojaah')}
                              disabled={!row.HalaqahID || row.halaqahMembers.length === 0}
                            >
                              <SelectTrigger className="w-40" data-testid={`select-santri-murojaah-${row.id}`}>
                                <SelectValue placeholder="Pilih Santri" />
                              </SelectTrigger>
                              <SelectContent>
                                {row.halaqahMembers.length > 0 ? (
                                  row.halaqahMembers.map((member) => {
                                    const santri = allSantri?.find(s => s.SantriID === member.SantriID && s.Aktif);
                                    if (!santri) return null;
                                    return (
                                      <SelectItem key={santri.SantriID} value={santri.SantriID}>
                                        {santri.NamaSantri}
                                      </SelectItem>
                                    );
                                  }).filter(Boolean)
                                ) : (
                                  <SelectItem value="__no_santri__" disabled>
                                    Pilih Halaqah terlebih dahulu
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.Kelas || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {allMusammi?.find(m => m.MusammiID === row.MusammiID)?.NamaMusammi || '-'}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={row.JumlahMurojaah}
                              onChange={(e) => updateMurojaahRow(row.id, 'JumlahMurojaah', parseFloat(e.target.value) || 0)}
                              className="w-20"
                              data-testid={`input-jumlah-murojaah-${row.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeMurojaahRow(row.id)}
                                data-testid={`button-remove-murojaah-${row.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {addingMurojaah && (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={addMurojaahRow}
                                data-testid="button-add-row-murojaah"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Baris
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveMurojaahRows}
                                disabled={batchUploadMurojaahMutation.isPending || murojaahRows.length === 0}
                                data-testid="button-save-all-murojaah"
                              >
                                {batchUploadMurojaahMutation.isPending ? 'Saving...' : `Simpan Semua (${murojaahRows.length})`}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAddingMurojaah(false);
                                  resetMurojaahRows();
                                }}
                                data-testid="button-cancel-murojaah"
                              >
                                Batal
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
                              <TableCell>{lookups?.marhalah.find(mar => mar.MarhalahID === m.MarhalahID)?.NamaMarhalah}</TableCell>
                              <TableCell>{halaqah?.NomorUrutHalaqah || 'N/A'}</TableCell>
                              <TableCell className="font-medium">{santri?.NamaSantri || 'N/A'}</TableCell>
                              <TableCell>{m.Kelas}</TableCell>
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
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Format CSV yang diperlukan:</p>
                <p className="text-xs">Kolom wajib: SantriID, HalaqahID, JumlahPenambahan</p>
                <p className="text-xs">Opsional: Bulan, MarhalahID, Kelas, MusammiID, Catatan</p>
              </TooltipContent>
            </Tooltip>
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
                setPenambahanRows([createNewPenambahanRow()]);
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
                        <TableHead>Marhalah</TableHead>
                        <TableHead>Halaqah</TableHead>
                        <TableHead>Nama Santri</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Musammi</TableHead>
                        <TableHead>Penambahan (Halaman)</TableHead>
                        <TableHead>Penambahan (Juz)</TableHead>
                        <TableHead>Catatan</TableHead>
                        {addingPenambahan && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addingPenambahan && penambahanRows.map((row) => (
                        <TableRow key={row.id} className="bg-muted/50" data-testid={`row-penambahan-new-${row.id}`}>
                          <TableCell>
                            <Input
                              type="month"
                              value={row.Bulan}
                              onChange={(e) => updatePenambahanRow(row.id, 'Bulan', e.target.value)}
                              className="w-32"
                              data-testid={`input-bulan-penambahan-${row.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              key={`marhalah-${row.id}`}
                              value={row.MarhalahID} 
                              onValueChange={(v) => handleMarhalahChange(row.id, v, 'penambahan')}
                            >
                              <SelectTrigger className="w-32" data-testid={`select-marhalah-penambahan-${row.id}`}>
                                <SelectValue placeholder="Pilih Marhalah" />
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
                              key={`halaqah-${row.id}-${row.MarhalahID}`}
                              value={row.HalaqahID ? row.HalaqahID : undefined} 
                              onValueChange={(v) => handleHalaqahChange(row.id, v, 'penambahan')}
                              disabled={!row.MarhalahID}
                            >
                              <SelectTrigger className="w-32" data-testid={`select-halaqah-penambahan-${row.id}`}>
                                <SelectValue placeholder="Pilih Halaqah" />
                              </SelectTrigger>
                              <SelectContent>
                                {allHalaqah?.filter(h => h.MarhalahID === row.MarhalahID).length ? (
                                  allHalaqah.filter(h => h.MarhalahID === row.MarhalahID).map((h) => {
                                    const musammi = allMusammi?.find(m => m.MusammiID === h.MusammiID);
                                    return (
                                      <SelectItem key={h.HalaqahID} value={h.HalaqahID}>
                                        {h.NomorUrutHalaqah} - {musammi?.NamaMusammi}
                                      </SelectItem>
                                    );
                                  })
                                ) : (
                                  <SelectItem value="__no_halaqah__" disabled>Tidak ada halaqah</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              key={`santri-${row.id}-${row.HalaqahID}`}
                              value={row.SantriID ? row.SantriID : undefined} 
                              onValueChange={(v) => handleSantriChange(row.id, v, 'penambahan')}
                              disabled={!row.HalaqahID || row.halaqahMembers.length === 0}
                            >
                              <SelectTrigger className="w-40" data-testid={`select-santri-penambahan-${row.id}`}>
                                <SelectValue placeholder="Pilih Santri" />
                              </SelectTrigger>
                              <SelectContent>
                                {row.halaqahMembers.length > 0 ? (
                                  row.halaqahMembers.map((member) => {
                                    const santri = allSantri?.find(s => s.SantriID === member.SantriID && s.Aktif);
                                    if (!santri) return null;
                                    return (
                                      <SelectItem key={santri.SantriID} value={santri.SantriID}>
                                        {santri.NamaSantri}
                                      </SelectItem>
                                    );
                                  }).filter(Boolean)
                                ) : (
                                  <SelectItem value="__no_santri__" disabled>
                                    Pilih Halaqah terlebih dahulu
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.Kelas || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {allMusammi?.find(m => m.MusammiID === row.MusammiID)?.NamaMusammi || '-'}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              value={row.JumlahPenambahan}
                              onChange={(e) => updatePenambahanRow(row.id, 'JumlahPenambahan', parseInt(e.target.value) || 0)}
                              className="w-20"
                              data-testid={`input-jumlah-penambahan-${row.id}`}
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {(row.JumlahPenambahan / 20).toFixed(2)} Juz
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={row.Catatan || ''}
                              onChange={(e) => updatePenambahanRow(row.id, 'Catatan', e.target.value)}
                              className="w-32"
                              placeholder="Optional"
                              data-testid={`input-catatan-penambahan-${row.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removePenambahanRow(row.id)}
                                data-testid={`button-remove-penambahan-${row.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {addingPenambahan && (
                        <TableRow>
                          <TableCell colSpan={9}>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={addPenambahanRow}
                                data-testid="button-add-row-penambahan"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Baris
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSavePenambahanRows}
                                disabled={batchUploadPenambahanMutation.isPending || penambahanRows.length === 0}
                                data-testid="button-save-all-penambahan"
                              >
                                {batchUploadPenambahanMutation.isPending ? 'Saving...' : `Simpan Semua (${penambahanRows.length})`}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAddingPenambahan(false);
                                  resetPenambahanRows();
                                }}
                                data-testid="button-cancel-penambahan"
                              >
                                Batal
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
                              <TableCell>{lookups?.marhalah.find(m => m.MarhalahID === p.MarhalahID)?.NamaMarhalah}</TableCell>
                              <TableCell>{halaqah?.NomorUrutHalaqah || 'N/A'}</TableCell>
                              <TableCell className="font-medium">{santri?.NamaSantri || 'N/A'}</TableCell>
                              <TableCell>{p.Kelas}</TableCell>
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
