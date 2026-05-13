import { StructureNode, LayoutSplitDivider } from '../types';

export const getAllDividers = (root: StructureNode, type?: 'horizontal' | 'vertical' | 'frame'): string[] => {
  let ids: string[] = [];
  
  if (root.dividers) {
    // If split is horizontal, the container renders vertically (rows), so dividers are horizontal
    // If split is vertical, the container renders horizontally (columns), so dividers are vertical
    const isNodeHorizontal = root.split === 'horizontal'; 
    const isNodeVertical = root.split === 'vertical';
    
    root.dividers.forEach(d => {
       if (d) {
         if (!type || 
             (type === 'horizontal' && isNodeHorizontal) || 
             (type === 'vertical' && isNodeVertical)) {
           ids.push(d.id);
         }
       }
    });
  }
  
  if (root.frame) {
    if (!type || type === 'frame') {
      if (root.frame.top) ids.push(root.frame.top.id);
      if (root.frame.bottom) ids.push(root.frame.bottom.id);
      if (root.frame.left) ids.push(root.frame.left.id);
      if (root.frame.right) ids.push(root.frame.right.id);
    }
  }

  if (root.children) {
    root.children.forEach(c => {
      ids = [...ids, ...getAllDividers(c, type)];
    });
  }
  
  return ids;
};

export const findNodeById = (root: StructureNode, id: string): StructureNode | null => {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};

export const findDividerInStructure = (root: StructureNode, dividerId: string): { parent: StructureNode, divider: LayoutSplitDivider } | null => {
  if (root.dividers) {
    const divider = root.dividers.find(d => d?.id === dividerId);
    if (divider) return { parent: root, divider };
  }
  if (root.frame) {
    for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
      if (root.frame[edge as keyof typeof root.frame]?.id === dividerId) {
        return { parent: root, divider: root.frame[edge as keyof typeof root.frame]! };
      }
    }
  }
  if (root.children) {
    for (const child of root.children) {
      const found = findDividerInStructure(child, dividerId);
      if (found) return found;
    }
  }
  return null;
};

export const replaceNodeById = (root: StructureNode, id: string, newNode: StructureNode): StructureNode => {
  if (root.id === id) return newNode;
  if (root.children) {
    return {
      ...root,
      children: root.children.map(c => replaceNodeById(c, id, newNode))
    };
  }
  return root;
};

export const getFullPath = (root: StructureNode, targetId: string, currentPath: string[] = []): string => {
  if (root.id === targetId) return [...currentPath, root.displayLabel || root.label || ''].filter(Boolean).join(' / ');
  if (root.children) {
    for (const child of root.children) {
      const path = getFullPath(child, targetId, [...currentPath, root.displayLabel || root.label || '']);
      if (path) return path;
    }
  }
  return '';
};
