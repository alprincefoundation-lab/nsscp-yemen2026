import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { HierarchyEngine } from '@/lib/hierarchy'
import { prisma } from '@/lib/prisma'

type HierarchyEntityRow = {
  id: string
  name: string
  code: string
  type: string
  parentId: string | null
}

type HierarchyTreeNode = HierarchyEntityRow & {
  children: HierarchyTreeNode[]
}

function buildTree(rows: HierarchyEntityRow[]): HierarchyTreeNode[] {
  const nodes = new Map<string, HierarchyTreeNode>()
  const roots: HierarchyTreeNode[] = []

  for (const row of rows) {
    nodes.set(row.id, { ...row, children: [] })
  }

  for (const row of rows) {
    const node = nodes.get(row.id)
    if (!node) {
      continue
    }

    if (row.parentId && nodes.has(row.parentId)) {
      nodes.get(row.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

function findSubtree(nodes: HierarchyTreeNode[], rootId: string): HierarchyTreeNode | null {
  for (const node of nodes) {
    if (node.id === rootId) {
      return node
    }

    const child = findSubtree(node.children, rootId)
    if (child) {
      return child
    }
  }

  return null
}

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''")
}

function sqlValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'NULL'
  }

  return `'${escapeSqlLiteral(value)}'`
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rootId = searchParams.get('rootId')
    const engine = new HierarchyEngine({
      id: authUser.id,
      role: authUser.role,
      hierarchyNodeId: authUser.hierarchyEntityId,
    })

    if (rootId) {
      const canAccess = await engine.canAccessHierarchy(rootId)
      if (!canAccess) {
        return NextResponse.json({ error: 'غير مصرح بالوصول لهذا الكيان' }, { status: 403 })
      }
    }

    const rows = await prisma.$queryRawUnsafe<HierarchyEntityRow[]>(`
      SELECT
        "id",
        "name",
        "code",
        "type",
        "parentId"
      FROM "HierarchyEntity"
      ORDER BY "name" ASC
    `)

    const tree = buildTree(rows)
    const data = rootId ? findSubtree(tree, rootId) : tree

    if (rootId && !data) {
      return NextResponse.json({ error: 'Hierarchy root not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
