import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertMusammiSchema,
  insertHalaqahSchema,
  insertSantriSchema,
  halaqahMembersSchema,
  batchAbsensiSchema,
  insertHafalanBulananSchema,
  insertMurojaahBulananSchema,
  insertPenambahanHafalanSchema,
  insertTasksSchema,
} from "@shared/schema";
import { ZodError } from "zod";

// Create partial schemas for updates
const updateHalaqahSchema = insertHalaqahSchema.partial();
const updateMusammiSchema = insertMusammiSchema.partial();
const updateSantriSchema = insertSantriSchema.partial();
const updateHalaqahMembersSchema = halaqahMembersSchema.partial();
const updateHafalanBulananSchema = insertHafalanBulananSchema.partial();
const updateMurojaahBulananSchema = insertMurojaahBulananSchema.partial();
const updateTasksSchema = insertTasksSchema.partial();

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== LOOKUPS ==========
  app.get("/api/lookups", async (req, res) => {
    try {
      const lookups = await storage.getLookups();
      res.json(lookups);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== HALAQAH CRUD ==========
  app.get("/api/halaqah", async (req, res) => {
    try {
      const { marhalah } = req.query;
      const halaqah = await storage.getAllHalaqah(marhalah as string);
      res.json(halaqah);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/halaqah/:id", async (req, res) => {
    try {
      const halaqah = await storage.getHalaqah(req.params.id);
      if (!halaqah) {
        return res.status(404).json({ error: "Halaqah not found" });
      }
      res.json(halaqah);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/halaqah", async (req, res) => {
    try {
      const validated = insertHalaqahSchema.parse(req.body);
      const halaqah = await storage.createHalaqah(validated);
      res.status(201).json(halaqah);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/halaqah/:id", async (req, res) => {
    try {
      const validated = updateHalaqahSchema.parse(req.body);
      const halaqah = await storage.updateHalaqah(req.params.id, validated);
      res.json(halaqah);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/halaqah/:id", async (req, res) => {
    try {
      await storage.deleteHalaqah(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== MUSAMMI CRUD ==========
  app.get("/api/musammi", async (req, res) => {
    try {
      const { marhalah } = req.query;
      const musammi = await storage.getAllMusammi(marhalah as string);
      res.json(musammi);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/musammi/:id", async (req, res) => {
    try {
      const musammi = await storage.getMusammi(req.params.id);
      if (!musammi) {
        return res.status(404).json({ error: "Musammi not found" });
      }
      res.json(musammi);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/musammi", async (req, res) => {
    try {
      const validated = insertMusammiSchema.parse(req.body);
      const musammi = await storage.createMusammi(validated);
      res.status(201).json(musammi);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/musammi/:id", async (req, res) => {
    try {
      const validated = updateMusammiSchema.parse(req.body);
      const musammi = await storage.updateMusammi(req.params.id, validated);
      res.json(musammi);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/musammi/:id", async (req, res) => {
    try {
      await storage.deleteMusammi(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== SANTRI CRUD ==========
  app.get("/api/santri", async (req, res) => {
    try {
      const { marhalah, aktif } = req.query;
      const aktifBool = aktif === 'true' ? true : aktif === 'false' ? false : undefined;
      const santri = await storage.getAllSantri(marhalah as string, aktifBool);
      res.json(santri);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/santri/:id", async (req, res) => {
    try {
      const santri = await storage.getSantri(req.params.id);
      if (!santri) {
        return res.status(404).json({ error: "Santri not found" });
      }
      res.json(santri);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/santri", async (req, res) => {
    try {
      const validated = insertSantriSchema.parse(req.body);
      const santri = await storage.createSantri(validated);
      res.status(201).json(santri);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/santri/:id", async (req, res) => {
    try {
      const validated = updateSantriSchema.parse(req.body);
      const santri = await storage.updateSantri(req.params.id, validated);
      res.json(santri);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/santri/:id", async (req, res) => {
    try {
      await storage.deleteSantri(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== HALAQAH MEMBERS CRUD ==========
  app.get("/api/halaqah-members", async (req, res) => {
    try {
      const { halaqahId } = req.query;
      if (!halaqahId) {
        return res.status(400).json({ error: "halaqahId is required" });
      }
      const members = await storage.getHalaqahMembers(halaqahId as string);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/halaqah-members", async (req, res) => {
    try {
      const validated = halaqahMembersSchema.parse(req.body);
      const member = await storage.createHalaqahMember(validated);
      res.status(201).json(member);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/halaqah-members/:halaqahId/:santriId", async (req, res) => {
    try {
      const validated = updateHalaqahMembersSchema.parse(req.body);
      const member = await storage.updateHalaqahMember(
        req.params.halaqahId,
        req.params.santriId,
        validated
      );
      res.json(member);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/halaqah-members/:halaqahId/:santriId", async (req, res) => {
    try {
      await storage.deleteHalaqahMember(req.params.halaqahId, req.params.santriId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== ABSENSI ==========
  app.post("/api/absensi/batch", async (req, res) => {
    try {
      const validated = batchAbsensiSchema.parse(req.body);
      const result = await storage.batchCreateAbsensi(validated);
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/absensi/santri", async (req, res) => {
    try {
      const { tanggal, marhalah, waktu } = req.query;
      if (!tanggal) {
        return res.status(400).json({ error: "tanggal is required" });
      }
      const absensi = await storage.getAbsensiSantri(
        tanggal as string,
        marhalah as string,
        waktu as string
      );
      res.json(absensi);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/absensi/musammi", async (req, res) => {
    try {
      const { tanggal, marhalah, waktu } = req.query;
      if (!tanggal) {
        return res.status(400).json({ error: "tanggal is required" });
      }
      const absensi = await storage.getAbsensiMusammi(
        tanggal as string,
        marhalah as string,
        waktu as string
      );
      res.json(absensi);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== HAFALAN ==========
  app.get("/api/hafalan", async (req, res) => {
    try {
      const { bulan, marhalah } = req.query;
      if (!bulan) {
        return res.status(400).json({ error: "bulan is required" });
      }
      const hafalan = await storage.getHafalanBulanan(bulan as string, marhalah as string);
      res.json(hafalan);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/hafalan", async (req, res) => {
    try {
      const validated = insertHafalanBulananSchema.parse(req.body);
      const hafalan = await storage.createHafalanBulanan(validated);
      res.status(201).json(hafalan);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/hafalan/:id", async (req, res) => {
    try {
      const validated = updateHafalanBulananSchema.parse(req.body);
      const hafalan = await storage.updateHafalanBulanan(req.params.id, validated);
      res.json(hafalan);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/hafalan/:id", async (req, res) => {
    try {
      await storage.deleteHafalanBulanan(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== MUROJAAH ==========
  app.get("/api/murojaah", async (req, res) => {
    try {
      const { bulan, marhalah } = req.query;
      if (!bulan) {
        return res.status(400).json({ error: "bulan is required" });
      }
      const murojaah = await storage.getMurojaahBulanan(bulan as string, marhalah as string);
      res.json(murojaah);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/murojaah", async (req, res) => {
    try {
      const validated = insertMurojaahBulananSchema.parse(req.body);
      const murojaah = await storage.createMurojaahBulanan(validated);
      res.status(201).json(murojaah);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/murojaah/:id", async (req, res) => {
    try {
      const validated = updateMurojaahBulananSchema.parse(req.body);
      const murojaah = await storage.updateMurojaahBulanan(req.params.id, validated);
      res.json(murojaah);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/murojaah/:id", async (req, res) => {
    try {
      await storage.deleteMurojaahBulanan(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== PENAMBAHAN HAFALAN ==========
  app.post("/api/penambahan", async (req, res) => {
    try {
      const validated = insertPenambahanHafalanSchema.parse(req.body);
      const penambahan = await storage.createPenambahanHafalan(validated);
      res.status(201).json(penambahan);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== TASKS ==========
  app.get("/api/tasks", async (req, res) => {
    try {
      const { status } = req.query;
      const tasks = await storage.getTasks(status as string);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validated = insertTasksSchema.parse(req.body);
      const task = await storage.createTask(validated);
      res.status(201).json(task);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const validated = updateTasksSchema.parse(req.body);
      const task = await storage.updateTask(req.params.id, validated);
      res.json(task);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ========== DASHBOARD ==========
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
