import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import { Category } from '../models/Category';
import {
  buildCategoryTree,
  collectCategoryAncestryIds,
  collectCategoryBranchIds,
  flattenCategoryTree,
} from '../utils/categoryTree';

const router = Router();

const makeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

router.get('/', async (_req: Request, res: Response) => {
  try {
    const categoryRepository = AppDataSource.getRepository(Category);

    const categories = await categoryRepository.find({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        iconUrl: true,
        parentId: true,
      },
    });
    const ordered = flattenCategoryTree(buildCategoryTree(categories)).map(
      ({ children, depth, ...category }) => ({
        ...category,
        depth,
      })
    );

    res.status(200).json({
      status: 'success',
      message: 'Categories fetched successfully',
      data: ordered,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories',
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const categoryRepository = AppDataSource.getRepository(Category);

    const category = await categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      res.status(404).json({
        status: 'error',
        message: 'Category not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Category fetched successfully',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch category',
    });
  }
});

router.post(
  '/',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const { name, description, iconUrl, parentId } = req.body;

      if (!name || !String(name).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Category name is required',
        });
        return;
      }

      const categoryRepository = AppDataSource.getRepository(Category);
      const categories = await categoryRepository.find({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          iconUrl: true,
          parentId: true,
        },
      });

      if (parentId) {
        const parent = categories.find((item) => item.id === parentId);

        if (!parent) {
          res.status(400).json({
            status: 'error',
            message: 'Parent category not found',
          });
          return;
        }
      }

      let slug = makeSlug(String(name));
      const existingSlug = await categoryRepository.findOne({ where: { slug } });

      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }

      const category = categoryRepository.create({
        name: String(name).trim(),
        slug,
        description: description?.trim() || null,
        iconUrl: iconUrl?.trim() || null,
        parentId: parentId || null,
      });

      await categoryRepository.save(category);

      res.status(201).json({
        status: 'success',
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create category',
      });
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const categoryRepository = AppDataSource.getRepository(Category);

      const category = await categoryRepository.findOne({
        where: { id },
      });

      if (!category) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }

      const { name, description, iconUrl, parentId } = req.body;

      const categories = await categoryRepository.find({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          iconUrl: true,
          parentId: true,
        },
      });

      if (parentId) {
        const parent = categories.find((item) => item.id === parentId);

        if (!parent) {
          res.status(400).json({
            status: 'error',
            message: 'Parent category not found',
          });
          return;
        }

        const branchIds = new Set(collectCategoryBranchIds(categories, category.id));
        if (branchIds.has(String(parentId))) {
          res.status(400).json({
            status: 'error',
            message: 'A category cannot be moved inside its own branch',
          });
          return;
        }
      }

      if (name && String(name).trim() !== category.name) {
        let slug = makeSlug(String(name));
        const existingSlug = await categoryRepository.findOne({ where: { slug } });

        if (existingSlug && existingSlug.id !== category.id) {
          slug = `${slug}-${Date.now()}`;
        }

        category.name = String(name).trim();
        category.slug = slug;
      }

      category.description =
        description !== undefined ? description?.trim() || null : category.description;

      category.iconUrl =
        iconUrl !== undefined ? iconUrl?.trim() || null : category.iconUrl;

      category.parentId =
        parentId !== undefined ? parentId || null : category.parentId;

      await categoryRepository.save(category);

      res.status(200).json({
        status: 'success',
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update category',
      });
    }
  }
);

router.delete(
  '/:id',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const categoryRepository = AppDataSource.getRepository(Category);

      const category = await categoryRepository.findOne({
        where: { id },
      });

      if (!category) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }

      const categories = await categoryRepository.find({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          iconUrl: true,
          parentId: true,
        },
      });
      const idsToDelete = collectCategoryBranchIds(categories, id).sort((leftId, rightId) => {
        const leftDepth = collectCategoryAncestryIds(categories, leftId).length;
        const rightDepth = collectCategoryAncestryIds(categories, rightId).length;
        return rightDepth - leftDepth;
      });

      for (const categoryId of idsToDelete) {
        await categoryRepository.delete(categoryId);
      }

      res.status(200).json({
        status: 'success',
        message: 'Category deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete category',
      });
    }
  }
);

export default router;
