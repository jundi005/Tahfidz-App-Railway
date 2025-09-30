import {
  type Halaqah,
  type InsertHalaqah,
  type Musammi,
  type InsertMusammi,
  type Santri,
  type InsertSantri,
  type HalaqahMembers,
  type InsertHalaqahMembers,
  type AbsensiSantri,
  type InsertAbsensiSantri,
  type AbsensiMusammi,
  type InsertAbsensiMusammi,
  type BatchAbsensi,
  type HafalanBulanan,
  type InsertHafalanBulanan,
  type MurojaahBulanan,
  type InsertMurojaahBulanan,
  type PenambahanHafalan,
  type InsertPenambahanHafalan,
  type Tasks,
  type InsertTasks,
  type DashboardStats,
  type LookupsResponse,
} from "@shared/schema";

export interface IStorage {
  // Lookups
  getLookups(): Promise<LookupsResponse>;

  // Halaqah
  getHalaqah(id: string): Promise<Halaqah | undefined>;
  getAllHalaqah(marhalahId?: string): Promise<Halaqah[]>;
  createHalaqah(halaqah: InsertHalaqah): Promise<Halaqah>;
  updateHalaqah(id: string, halaqah: Partial<InsertHalaqah>): Promise<Halaqah>;
  deleteHalaqah(id: string): Promise<void>;

  // Musammi
  getMusammi(id: string): Promise<Musammi | undefined>;
  getAllMusammi(marhalahId?: string): Promise<Musammi[]>;
  createMusammi(musammi: InsertMusammi): Promise<Musammi>;
  updateMusammi(id: string, musammi: Partial<InsertMusammi>): Promise<Musammi>;
  deleteMusammi(id: string): Promise<void>;

  // Santri
  getSantri(id: string): Promise<Santri | undefined>;
  getAllSantri(marhalahId?: string, aktif?: boolean): Promise<Santri[]>;
  createSantri(santri: InsertSantri): Promise<Santri>;
  updateSantri(id: string, santri: Partial<InsertSantri>): Promise<Santri>;
  deleteSantri(id: string): Promise<void>;

  // HalaqahMembers
  getHalaqahMembers(halaqahId: string): Promise<HalaqahMembers[]>;
  createHalaqahMember(member: InsertHalaqahMembers): Promise<HalaqahMembers>;
  updateHalaqahMember(halaqahId: string, santriId: string, member: Partial<InsertHalaqahMembers>): Promise<HalaqahMembers>;
  deleteHalaqahMember(halaqahId: string, santriId: string): Promise<void>;

  // Absensi
  batchCreateAbsensi(data: BatchAbsensi): Promise<{ musammi: AbsensiMusammi[]; santri: AbsensiSantri[] }>;
  getAbsensiSantri(tanggal: string, marhalahId?: string, waktuId?: string): Promise<AbsensiSantri[]>;
  getAbsensiMusammi(tanggal: string, marhalahId?: string, waktuId?: string): Promise<AbsensiMusammi[]>;

  // Hafalan
  getHafalanBulanan(bulan: string, marhalahId?: string): Promise<HafalanBulanan[]>;
  createHafalanBulanan(hafalan: InsertHafalanBulanan): Promise<HafalanBulanan>;
  updateHafalanBulanan(id: string, hafalan: Partial<InsertHafalanBulanan>): Promise<HafalanBulanan>;
  deleteHafalanBulanan(id: string): Promise<void>;

  // Murojaah
  getMurojaahBulanan(bulan: string, marhalahId?: string): Promise<MurojaahBulanan[]>;
  createMurojaahBulanan(murojaah: InsertMurojaahBulanan): Promise<MurojaahBulanan>;
  updateMurojaahBulanan(id: string, murojaah: Partial<InsertMurojaahBulanan>): Promise<MurojaahBulanan>;
  deleteMurojaahBulanan(id: string): Promise<void>;

  // Penambahan Hafalan
  createPenambahanHafalan(penambahan: InsertPenambahanHafalan): Promise<PenambahanHafalan>;

  // Tasks
  getTasks(status?: string): Promise<Tasks[]>;
  createTask(task: InsertTasks): Promise<Tasks>;
  updateTask(id: string, task: Partial<InsertTasks>): Promise<Tasks>;
  deleteTask(id: string): Promise<void>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
}

// Google Sheets Storage Implementation
export class GoogleSheetsStorage implements IStorage {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.GOOGLE_APPS_SCRIPT_URL || "";
  }

  private async request<T>(endpoint: string, options?: RequestInit & { allowUndefined?: boolean }): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Google Apps Script always returns 200 OK, error info is in JSON body
    const data = await response.json();

    // Google Apps Script returns { error, code } for errors
    if (data && typeof data === 'object' && 'error' in data) {
      if (data.code === 404 && options?.allowUndefined) {
        return undefined as T;
      }
      throw new Error(data.error);
    }

    // Google Apps Script returns { success, message } for DELETE operations
    if (data && typeof data === 'object' && 'success' in data && data.success) {
      return undefined as T;
    }

    return data;
  }

  async getLookups(): Promise<LookupsResponse> {
    return this.request<LookupsResponse>('/lookups');
  }

  async getHalaqah(id: string): Promise<Halaqah | undefined> {
    return this.request<Halaqah>(`/halaqah/${id}`, { allowUndefined: true });
  }

  async getAllHalaqah(marhalahId?: string): Promise<Halaqah[]> {
    const query = marhalahId ? `?marhalah=${marhalahId}` : '';
    return this.request<Halaqah[]>(`/halaqah${query}`);
  }

  async createHalaqah(halaqah: InsertHalaqah): Promise<Halaqah> {
    return this.request<Halaqah>('/halaqah', {
      method: 'POST',
      body: JSON.stringify(halaqah),
    });
  }

  async updateHalaqah(id: string, halaqah: Partial<InsertHalaqah>): Promise<Halaqah> {
    return this.request<Halaqah>(`/halaqah/${id}`, {
      method: 'PUT',
      body: JSON.stringify(halaqah),
    });
  }

  async deleteHalaqah(id: string): Promise<void> {
    await this.request(`/halaqah/${id}`, { method: 'DELETE' });
  }

  async getMusammi(id: string): Promise<Musammi | undefined> {
    return this.request<Musammi>(`/musammi/${id}`, { allowUndefined: true });
  }

  async getAllMusammi(marhalahId?: string): Promise<Musammi[]> {
    const query = marhalahId ? `?marhalah=${marhalahId}` : '';
    return this.request<Musammi[]>(`/musammi${query}`);
  }

  async createMusammi(musammi: InsertMusammi): Promise<Musammi> {
    return this.request<Musammi>('/musammi', {
      method: 'POST',
      body: JSON.stringify(musammi),
    });
  }

  async updateMusammi(id: string, musammi: Partial<InsertMusammi>): Promise<Musammi> {
    return this.request<Musammi>(`/musammi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(musammi),
    });
  }

  async deleteMusammi(id: string): Promise<void> {
    await this.request(`/musammi/${id}`, { method: 'DELETE' });
  }

  async getSantri(id: string): Promise<Santri | undefined> {
    return this.request<Santri>(`/santri/${id}`, { allowUndefined: true });
  }

  async getAllSantri(marhalahId?: string, aktif?: boolean): Promise<Santri[]> {
    const params = new URLSearchParams();
    if (marhalahId) params.append('marhalah', marhalahId);
    if (aktif !== undefined) params.append('aktif', aktif.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Santri[]>(`/santri${query}`);
  }

  async createSantri(santri: InsertSantri): Promise<Santri> {
    return this.request<Santri>('/santri', {
      method: 'POST',
      body: JSON.stringify(santri),
    });
  }

  async updateSantri(id: string, santri: Partial<InsertSantri>): Promise<Santri> {
    return this.request<Santri>(`/santri/${id}`, {
      method: 'PUT',
      body: JSON.stringify(santri),
    });
  }

  async deleteSantri(id: string): Promise<void> {
    await this.request(`/santri/${id}`, { method: 'DELETE' });
  }

  async getHalaqahMembers(halaqahId: string): Promise<HalaqahMembers[]> {
    return this.request<HalaqahMembers[]>(`/halaqah-members?halaqahId=${halaqahId}`);
  }

  async createHalaqahMember(member: InsertHalaqahMembers): Promise<HalaqahMembers> {
    return this.request<HalaqahMembers>('/halaqah-members', {
      method: 'POST',
      body: JSON.stringify(member),
    });
  }

  async updateHalaqahMember(halaqahId: string, santriId: string, member: Partial<InsertHalaqahMembers>): Promise<HalaqahMembers> {
    return this.request<HalaqahMembers>(`/halaqah-members/${halaqahId}/${santriId}`, {
      method: 'PUT',
      body: JSON.stringify(member),
    });
  }

  async deleteHalaqahMember(halaqahId: string, santriId: string): Promise<void> {
    await this.request(`/halaqah-members/${halaqahId}/${santriId}`, { method: 'DELETE' });
  }

  async batchCreateAbsensi(data: BatchAbsensi): Promise<{ musammi: AbsensiMusammi[]; santri: AbsensiSantri[] }> {
    return this.request<{ musammi: AbsensiMusammi[]; santri: AbsensiSantri[] }>('/absensi/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAbsensiSantri(tanggal: string, marhalahId?: string, waktuId?: string): Promise<AbsensiSantri[]> {
    const params = new URLSearchParams({ tanggal });
    if (marhalahId) params.append('marhalah', marhalahId);
    if (waktuId) params.append('waktu', waktuId);
    return this.request<AbsensiSantri[]>(`/absensi/santri?${params.toString()}`);
  }

  async getAbsensiMusammi(tanggal: string, marhalahId?: string, waktuId?: string): Promise<AbsensiMusammi[]> {
    const params = new URLSearchParams({ tanggal });
    if (marhalahId) params.append('marhalah', marhalahId);
    if (waktuId) params.append('waktu', waktuId);
    return this.request<AbsensiMusammi[]>(`/absensi/musammi?${params.toString()}`);
  }

  async getHafalanBulanan(bulan: string, marhalahId?: string): Promise<HafalanBulanan[]> {
    const params = new URLSearchParams({ bulan });
    if (marhalahId) params.append('marhalah', marhalahId);
    return this.request<HafalanBulanan[]>(`/hafalan?${params.toString()}`);
  }

  async createHafalanBulanan(hafalan: InsertHafalanBulanan): Promise<HafalanBulanan> {
    return this.request<HafalanBulanan>('/hafalan', {
      method: 'POST',
      body: JSON.stringify(hafalan),
    });
  }

  async updateHafalanBulanan(id: string, hafalan: Partial<InsertHafalanBulanan>): Promise<HafalanBulanan> {
    return this.request<HafalanBulanan>(`/hafalan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(hafalan),
    });
  }

  async deleteHafalanBulanan(id: string): Promise<void> {
    await this.request(`/hafalan/${id}`, { method: 'DELETE' });
  }

  async getMurojaahBulanan(bulan: string, marhalahId?: string): Promise<MurojaahBulanan[]> {
    const params = new URLSearchParams({ bulan });
    if (marhalahId) params.append('marhalah', marhalahId);
    return this.request<MurojaahBulanan[]>(`/murojaah?${params.toString()}`);
  }

  async createMurojaahBulanan(murojaah: InsertMurojaahBulanan): Promise<MurojaahBulanan> {
    return this.request<MurojaahBulanan>('/murojaah', {
      method: 'POST',
      body: JSON.stringify(murojaah),
    });
  }

  async updateMurojaahBulanan(id: string, murojaah: Partial<InsertMurojaahBulanan>): Promise<MurojaahBulanan> {
    return this.request<MurojaahBulanan>(`/murojaah/${id}`, {
      method: 'PUT',
      body: JSON.stringify(murojaah),
    });
  }

  async deleteMurojaahBulanan(id: string): Promise<void> {
    await this.request(`/murojaah/${id}`, { method: 'DELETE' });
  }

  async createPenambahanHafalan(penambahan: InsertPenambahanHafalan): Promise<PenambahanHafalan> {
    return this.request<PenambahanHafalan>('/penambahan', {
      method: 'POST',
      body: JSON.stringify(penambahan),
    });
  }

  async getTasks(status?: string): Promise<Tasks[]> {
    const query = status ? `?status=${status}` : '';
    return this.request<Tasks[]>(`/tasks${query}`);
  }

  async createTask(task: InsertTasks): Promise<Tasks> {
    return this.request<Tasks>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, task: Partial<InsertTasks>): Promise<Tasks> {
    return this.request<Tasks>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  }

  async deleteTask(id: string): Promise<void> {
    await this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats');
  }
}

export const storage = new GoogleSheetsStorage();
