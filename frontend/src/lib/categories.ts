export interface MarketplaceCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  iconUrl?: string | null;
  parentId?: string | null;
  children?: MarketplaceCategory[];
  depth?: number;
}

export interface CategoryNode extends MarketplaceCategory {
  parentId: string | null;
  children: CategoryNode[];
}

export interface CategoryOption {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  parentId: string | null;
  label: string;
  pathIds: string[];
  pathNames: string[];
  depth: number;
}

export const normalizeCategoryValue = (value: string) => value.trim().toLowerCase();

export const flattenMarketplaceCategories = (
  categories: MarketplaceCategory[]
): MarketplaceCategory[] => {
  const seen = new Map<string, MarketplaceCategory>();

  const visit = (category: MarketplaceCategory, inheritedParentId?: string | null) => {
    const normalizedParentId =
      category.parentId !== undefined ? category.parentId : inheritedParentId || null;

    seen.set(category.id, {
      ...category,
      parentId: normalizedParentId,
      children: undefined,
    });

    (category.children || []).forEach((child) => visit(child, category.id));
  };

  categories.forEach((category) => visit(category));

  return Array.from(seen.values());
};

export const buildCategoryTree = (categories: MarketplaceCategory[]): CategoryNode[] => {
  const flat = flattenMarketplaceCategories(categories);
  const lookup = new Map<string, CategoryNode>();

  flat.forEach((category) => {
    lookup.set(category.id, {
      ...category,
      parentId: category.parentId || null,
      children: [],
    });
  });

  const roots: CategoryNode[] = [];

  lookup.forEach((node) => {
    if (node.parentId && lookup.has(node.parentId)) {
      lookup.get(node.parentId)!.children.push(node);
      return;
    }

    roots.push(node);
  });

  const sortNode = (node: CategoryNode) => {
    node.children.sort((left, right) =>
      left.name.localeCompare(right.name, 'ar', {
        sensitivity: 'base',
        numeric: true,
      })
    );
    node.children.forEach(sortNode);
  };

  roots.sort((left, right) =>
    left.name.localeCompare(right.name, 'ar', {
      sensitivity: 'base',
      numeric: true,
    })
  );
  roots.forEach(sortNode);

  return roots;
};

export const flattenCategoryTree = (
  nodes: CategoryNode[],
  depth = 0,
  pathIds: string[] = [],
  pathNames: string[] = []
): CategoryOption[] =>
  nodes.flatMap((node) => {
    const nextPathIds = [...pathIds, node.id];
    const nextPathNames = [...pathNames, node.name];

    return [
      {
        id: node.id,
        name: node.name,
        slug: node.slug,
        description: node.description || null,
        parentId: node.parentId,
        label: nextPathNames.join(' / '),
        pathIds: nextPathIds,
        pathNames: nextPathNames,
        depth,
      },
      ...flattenCategoryTree(node.children, depth + 1, nextPathIds, nextPathNames),
    ];
  });

export const getCategoryLookup = (categories: MarketplaceCategory[]) => {
  const flat = flattenCategoryTree(buildCategoryTree(categories));
  return new Map(flat.map((category) => [category.id, category]));
};

export const resolveCategoryId = (
  categories: MarketplaceCategory[],
  categoryValue: string
) => {
  if (!categoryValue.trim()) {
    return '';
  }

  const normalizedValue = normalizeCategoryValue(categoryValue);
  const flat = flattenCategoryTree(buildCategoryTree(categories));
  const matchedCategory = flat.find((category) => {
    return (
      category.id === categoryValue ||
      normalizeCategoryValue(category.slug || '') === normalizedValue ||
      normalizeCategoryValue(category.name) === normalizedValue
    );
  });

  return matchedCategory?.id || categoryValue;
};

export const getRootCategoryId = (
  categories: MarketplaceCategory[],
  categoryId: string
) => {
  const lookup = getCategoryLookup(categories);
  const visited = new Set<string>();
  let currentId: string | null | undefined = categoryId;
  let rootId: string | null = null;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    rootId = currentId;
    currentId = lookup.get(currentId)?.parentId || null;
  }

  return rootId;
};

export const getRootCategories = (categories: MarketplaceCategory[]) =>
  buildCategoryTree(categories).map((node) => ({
    id: node.id,
    name: node.name,
    slug: node.slug,
    description: node.description,
    parentId: null,
    label: node.name,
    pathIds: [node.id],
    pathNames: [node.name],
    depth: 0,
  }));

export const getBranchSubcategories = (
  categories: MarketplaceCategory[],
  rootCategoryId: string
) => {
  const tree = buildCategoryTree(categories);
  const rootNode = tree.find((node) => node.id === rootCategoryId);

  if (!rootNode) {
    return [];
  }

  return flattenCategoryTree(rootNode.children, 1, [rootNode.id], [rootNode.name]).map(
    (category) => ({
      ...category,
      label: category.pathNames.slice(1).join(' / ') || category.name,
    })
  );
};
