import Category from '../models/Category';

export type CategoryBranchNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  providerCount?: number;
  parentId: string | null;
  children: CategoryBranchNode[];
};

type CategoryShape = Pick<
  Category,
  'id' | 'name' | 'slug' | 'description' | 'iconUrl' | 'parentId'
> & {
  providerCount?: number;
};

const compareCategories = (left: CategoryShape, right: CategoryShape) =>
  left.name.localeCompare(right.name, 'ar', {
    sensitivity: 'base',
    numeric: true,
  });

export const buildCategoryTree = (
  categories: CategoryShape[]
): CategoryBranchNode[] => {
  const lookup = new Map<string, CategoryBranchNode>();

  categories.forEach((category) => {
    lookup.set(category.id, {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      iconUrl: category.iconUrl,
      providerCount: category.providerCount,
      parentId: category.parentId,
      children: [],
    });
  });

  const roots: CategoryBranchNode[] = [];

  lookup.forEach((node) => {
    if (node.parentId && lookup.has(node.parentId)) {
      lookup.get(node.parentId)!.children.push(node);
      return;
    }

    roots.push(node);
  });

  const sortNode = (node: CategoryBranchNode) => {
    node.children.sort(compareCategories);
    node.children.forEach(sortNode);
  };

  roots.sort(compareCategories);
  roots.forEach(sortNode);

  return roots;
};

export const flattenCategoryTree = (
  nodes: CategoryBranchNode[],
  depth = 0
): Array<CategoryBranchNode & { depth: number }> => {
  return nodes.flatMap((node) => [
    {
      ...node,
      depth,
    },
    ...flattenCategoryTree(node.children, depth + 1),
  ]);
};

export const collectCategoryBranchIds = (
  categories: CategoryShape[],
  categoryId: string,
  options?: { includeSelf?: boolean }
) => {
  const includeSelf = options?.includeSelf ?? true;
  const childrenByParent = new Map<string, string[]>();

  categories.forEach((category) => {
    if (!category.parentId) {
      return;
    }

    const current = childrenByParent.get(category.parentId) || [];
    current.push(category.id);
    childrenByParent.set(category.parentId, current);
  });

  const visited = new Set<string>();
  const result: string[] = [];
  const stack = includeSelf ? [categoryId] : [...(childrenByParent.get(categoryId) || [])];

  while (stack.length) {
    const current = stack.pop()!;
    if (visited.has(current)) {
      continue;
    }

    visited.add(current);
    result.push(current);

    const children = childrenByParent.get(current) || [];
    children.forEach((childId) => stack.push(childId));
  }

  return result;
};

export const collectCategoryAncestryIds = (
  categories: CategoryShape[],
  categoryId: string
) => {
  const parentById = new Map(
    categories.map((category) => [category.id, category.parentId] as const)
  );
  const lineage: string[] = [];
  const visited = new Set<string>();
  let current: string | null | undefined = categoryId;

  while (current) {
    if (visited.has(current)) {
      break;
    }

    visited.add(current);
    lineage.push(current);
    current = parentById.get(current) || null;
  }

  return lineage;
};

export const getRootCategoryId = (
  categories: CategoryShape[],
  categoryId: string | null | undefined
) => {
  if (!categoryId) {
    return null;
  }

  const lineage = collectCategoryAncestryIds(categories, categoryId);
  return lineage[lineage.length - 1] || null;
};
