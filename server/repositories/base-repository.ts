import { PrismaClient } from '@prisma/client';

export type QueryOptions = {
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  select?: Record<string, boolean>;
  include?: Record<string, boolean>;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export abstract class BaseRepository<T, TWhereInput = Record<string, unknown>, TCreateInput = Record<string, unknown>, TUpdateInput = Record<string, unknown>> {
  protected prisma: PrismaClient;
  protected abstract modelName: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  protected get model(): Record<string, (...args: unknown[]) => Promise<unknown>> {
    return (this.prisma as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>)[this.modelName] as Record<string, (...args: unknown[]) => Promise<unknown>>;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } }) as Promise<T | null>;
  }

  async findMany(where?: TWhereInput, options?: QueryOptions): Promise<T[]> {
    const args: Record<string, unknown> = {};
    if (where) args.where = where;
    if (options?.skip !== undefined) args.skip = options.skip;
    if (options?.take !== undefined) args.take = options.take;
    if (options?.orderBy) args.orderBy = options.orderBy;
    if (options?.select) args.select = options.select;
    if (options?.include) args.include = options.include;
    return this.model.findMany(args) as Promise<T[]>;
  }

  async findFirst(where?: TWhereInput, options?: QueryOptions): Promise<T | null> {
    const args: Record<string, unknown> = {};
    if (where) args.where = where;
    if (options?.orderBy) args.orderBy = options.orderBy;
    if (options?.select) args.select = options.select;
    if (options?.include) args.include = options.include;
    return this.model.findFirst(args) as Promise<T | null>;
  }

  async findPaginated(
    where?: TWhereInput,
    page: number = 1,
    pageSize: number = 20,
    options?: QueryOptions,
  ): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * pageSize;
    const args: Record<string, unknown> = {};
    if (where) args.where = where;
    args.skip = skip;
    args.take = pageSize;
    if (options?.orderBy) args.orderBy = options.orderBy;
    if (options?.select) args.select = options.select;
    if (options?.include) args.include = options.include;

    const [data, total] = await Promise.all([
      this.model.findMany(args) as Promise<T[]>,
      this.model.count({ where }) as Promise<number>,
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async create(data: TCreateInput): Promise<T> {
    return this.model.create({ data }) as Promise<T>;
  }

  async createMany(data: TCreateInput[]): Promise<number> {
    const result = await this.model.createMany({ data }) as { count: number };
    return result.count;
  }

  async update(id: string, data: TUpdateInput): Promise<T> {
    return this.model.update({ where: { id }, data }) as Promise<T>;
  }

  async updateMany(where: TWhereInput, data: TUpdateInput): Promise<number> {
    const result = await this.model.updateMany({ where, data }) as { count: number };
    return result.count;
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } }) as Promise<T>;
  }

  async deleteMany(where: TWhereInput): Promise<number> {
    const result = await this.model.deleteMany({ where }) as { count: number };
    return result.count;
  }

  async count(where?: TWhereInput): Promise<number> {
    return this.model.count({ where }) as Promise<number>;
  }

  async exists(where: TWhereInput): Promise<boolean> {
    const count = await this.model.count({ where }) as number;
    return count > 0;
  }

  async upsert(id: string, create: TCreateInput, update: TUpdateInput): Promise<T> {
    return this.model.upsert({
      where: { id },
      create,
      update,
    }) as Promise<T>;
  }

  async executeRaw(query: string, ...params: unknown[]): Promise<unknown> {
    return this.prisma.$executeRawUnsafe(query, ...params);
  }

  async queryRaw<R = unknown>(query: string, ...params: unknown[]): Promise<R[]> {
    return this.prisma.$queryRawUnsafe(query, ...params) as Promise<R[]>;
  }

  async transaction<R>(fn: (tx: PrismaClient) => Promise<R>): Promise<R> {
    return this.prisma.$transaction(async (tx) => {
      return fn(tx as unknown as PrismaClient);
    });
  }
}