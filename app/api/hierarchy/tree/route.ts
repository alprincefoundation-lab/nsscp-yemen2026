import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getApiScope } from '@/lib/hierarchy/data-scope'

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

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rootId = searchParams.get('rootId')
    const scope = await getApiScope(authUser.id, authUser.role, authUser.hierarchyEntityId)
    const allowedIds = scope.allowedEntityIds

    if (rootId && allowedIds.length > 0 && !allowedIds.includes(rootId)) {
      return NextResponse.json({ error: 'غير مصرح بالوصول لهذا الكيان' }, { status: 403 })
    }

    const rows = await prisma.$queryRaw<HierarchyEntityRow[]>(Prisma.sql`
      SELECT
        "id",
        "name",
        "code",
        "type",
        "parentId"
      FROM "HierarchyEntity"
      ${
        allowedIds.length > 0
          ? Prisma.sql`WHERE "id" IN (${Prisma.join(allowedIds)})`
          : Prisma.empty
      }
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
