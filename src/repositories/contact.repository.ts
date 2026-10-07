import connectDB from '@/lib/db';
import { Contact, IContact, ContactStatus } from '@/models/contact.model';
import { QueryFilter, UpdateQuery } from 'mongoose';

export interface ContactPaginationOptions {
  page?: number;
  limit?: number;
  status?: ContactStatus | 'all';
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ContactStats {
  total: number;
  new: number;
  read: number;
  contacted: number;
  archived: number;
  receivedThisWeek: number;
}

export class ContactRepository {
  private async ensureDB() {
    await connectDB();
  }

  async create(data: Partial<IContact>): Promise<IContact> {
    await this.ensureDB();
    return Contact.create(data);
  }

  async findById(id: string): Promise<IContact | null> {
    await this.ensureDB();
    return Contact.findById(id).exec();
  }

  async findOne(filter: QueryFilter<IContact>): Promise<IContact | null> {
    await this.ensureDB();
    return Contact.findOne(filter).exec();
  }

  async findWithPagination(options: ContactPaginationOptions = {}): Promise<PaginatedResult<IContact>> {
    await this.ensureDB();

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (options.status && options.status !== 'all') {
      filter.status = options.status;
    }

    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { message: searchRegex },
      ];
    }

    const [data, total] = await Promise.all([
      Contact
        .find(filter as QueryFilter<IContact>)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Contact.countDocuments(filter as QueryFilter<IContact>).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async updateStatus(
    id: string,
    status: ContactStatus,
    adminNotes?: string
  ): Promise<IContact | null> {
    await this.ensureDB();
    const updateData: Record<string, unknown> = { status };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    return Contact.findByIdAndUpdate(id, updateData as UpdateQuery<IContact>, { new: true }).exec();
  }

  async delete(id: string): Promise<IContact | null> {
    await this.ensureDB();
    return Contact.findByIdAndDelete(id).exec();
  }

  async getStats(): Promise<ContactStats> {
    await this.ensureDB();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [total, newCount, readCount, contactedCount, archivedCount, thisWeekCount] =
      await Promise.all([
        Contact.countDocuments().exec(),
        Contact.countDocuments({ status: 'new' }).exec(),
        Contact.countDocuments({ status: 'read' }).exec(),
        Contact.countDocuments({ status: 'contacted' }).exec(),
        Contact.countDocuments({ status: 'archived' }).exec(),
        Contact.countDocuments({ createdAt: { $gte: sevenDaysAgo } }).exec(),
      ]);

    return {
      total,
      new: newCount,
      read: readCount,
      contacted: contactedCount,
      archived: archivedCount,
      receivedThisWeek: thisWeekCount,
    };
  }
}

export const contactRepository = new ContactRepository();
export default contactRepository;
