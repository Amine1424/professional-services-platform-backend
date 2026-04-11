import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import Region from '../models/Region';
import Wilaya from '../models/Wilaya';

const router = Router();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

router.get(
  '/regions',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (_req: Request, res: Response) => {
    try {
      const regionRepo = AppDataSource.getRepository(Region);
      const wilayaRepo = AppDataSource.getRepository(Wilaya);

      const [regions, wilayas] = await Promise.all([
        regionRepo.find({
          order: { displayOrder: 'ASC', createdAt: 'DESC' },
        }),
        wilayaRepo.find({
          order: { displayOrder: 'ASC', createdAt: 'DESC' },
        }),
      ]);

      res.status(200).json({
        status: 'success',
        message: 'Regions fetched successfully',
        data: regions.map((region) => ({
          ...region,
          wilayas: wilayas.filter((wilaya) => wilaya.regionId === region.id),
        })),
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch regions',
      });
    }
  }
);

router.post(
  '/regions',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const { name, slug, code, displayOrder, isActive } = req.body;

      if (!name || !String(name).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Region name is required',
        });
        return;
      }

      const repo = AppDataSource.getRepository(Region);

      const item = repo.create({
        name: String(name).trim(),
        slug: String(slug || slugify(String(name))).trim(),
        code: code ? String(code).trim() : null,
        displayOrder: Number(displayOrder || 0),
        isActive: typeof isActive === 'boolean' ? isActive : true,
      });

      await repo.save(item);

      res.status(201).json({
        status: 'success',
        message: 'Region created successfully',
        data: item,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create region',
      });
    }
  }
);

router.put(
  '/regions/:id',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { name, slug, code, displayOrder, isActive } = req.body;

      const repo = AppDataSource.getRepository(Region);
      const item = await repo.findOne({ where: { id } });

      if (!item) {
        res.status(404).json({
          status: 'error',
          message: 'Region not found',
        });
        return;
      }

      if (name !== undefined) item.name = String(name).trim();
      if (slug !== undefined) item.slug = String(slug).trim();
      if (code !== undefined) item.code = String(code).trim() || null;
      if (displayOrder !== undefined) item.displayOrder = Number(displayOrder || 0);
      if (isActive !== undefined) item.isActive = Boolean(isActive);

      await repo.save(item);

      res.status(200).json({
        status: 'success',
        message: 'Region updated successfully',
        data: item,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update region',
      });
    }
  }
);

router.delete(
  '/regions/:id',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);

      const repo = AppDataSource.getRepository(Region);
      const item = await repo.findOne({ where: { id } });

      if (!item) {
        res.status(404).json({
          status: 'error',
          message: 'Region not found',
        });
        return;
      }

      await repo.remove(item);

      res.status(200).json({
        status: 'success',
        message: 'Region deleted successfully',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete region',
      });
    }
  }
);

router.get(
  '/wilayas',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (_req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Wilaya);
      const items = await repo.find({
        relations: ['region'],
        order: { displayOrder: 'ASC', createdAt: 'DESC' },
      });

      res.status(200).json({
        status: 'success',
        message: 'Wilayas fetched successfully',
        data: items,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch wilayas',
      });
    }
  }
);

router.post(
  '/wilayas',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const { regionId, name, slug, code, displayOrder, isActive } = req.body;

      if (!name || !String(name).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Wilaya name is required',
        });
        return;
      }

      const repo = AppDataSource.getRepository(Wilaya);

      const item = repo.create({
        regionId: regionId || null,
        name: String(name).trim(),
        slug: String(slug || slugify(String(name))).trim(),
        code: code ? String(code).trim() : null,
        displayOrder: Number(displayOrder || 0),
        isActive: typeof isActive === 'boolean' ? isActive : true,
      });

      await repo.save(item);

      res.status(201).json({
        status: 'success',
        message: 'Wilaya created successfully',
        data: item,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create wilaya',
      });
    }
  }
);

router.put(
  '/wilayas/:id',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { regionId, name, slug, code, displayOrder, isActive } = req.body;

      const repo = AppDataSource.getRepository(Wilaya);
      const item = await repo.findOne({ where: { id } });

      if (!item) {
        res.status(404).json({
          status: 'error',
          message: 'Wilaya not found',
        });
        return;
      }

      if (regionId !== undefined) item.regionId = regionId || null;
      if (name !== undefined) item.name = String(name).trim();
      if (slug !== undefined) item.slug = String(slug).trim();
      if (code !== undefined) item.code = String(code).trim() || null;
      if (displayOrder !== undefined) item.displayOrder = Number(displayOrder || 0);
      if (isActive !== undefined) item.isActive = Boolean(isActive);

      await repo.save(item);

      res.status(200).json({
        status: 'success',
        message: 'Wilaya updated successfully',
        data: item,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update wilaya',
      });
    }
  }
);

router.delete(
  '/wilayas/:id',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);

      const repo = AppDataSource.getRepository(Wilaya);
      const item = await repo.findOne({ where: { id } });

      if (!item) {
        res.status(404).json({
          status: 'error',
          message: 'Wilaya not found',
        });
        return;
      }

      await repo.remove(item);

      res.status(200).json({
        status: 'success',
        message: 'Wilaya deleted successfully',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete wilaya',
      });
    }
  }
);

export default router;