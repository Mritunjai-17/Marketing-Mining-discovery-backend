import connectDB from '@/lib/db';
import { Admin, IAdmin, AdminStatus } from '@/models/admin.model';

export class AdminRepository {
  private async ensureDB() {
    await connectDB();
  }

  async findByEmail(email: string): Promise<IAdmin | null> {
    await this.ensureDB();
    return Admin.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findById(id: string): Promise<IAdmin | null> {
    await this.ensureDB();
    return Admin.findById(id).exec();
  }

  async findAll(): Promise<IAdmin[]> {
    await this.ensureDB();
    return Admin.find({}).select('-password').sort({ createdAt: -1 }).exec();
  }

  async create(data: Partial<IAdmin>): Promise<IAdmin> {
    await this.ensureDB();
    return Admin.create(data);
  }

  async updateLastLogin(id: string): Promise<IAdmin | null> {
    await this.ensureDB();
    return Admin.findByIdAndUpdate(id, { lastLogin: new Date() }, { new: true }).exec();
  }

  async updateStatus(
    id: string,
    status: AdminStatus,
    approvedBy?: string
  ): Promise<IAdmin | null> {
    await this.ensureDB();
    const updateData: Record<string, unknown> = {
      status,
      approvedAt: status === 'approved' ? new Date() : null,
      approvedBy: status === 'approved' ? approvedBy || 'Super Admin' : null,
    };
    return Admin.findByIdAndUpdate(id, updateData, { new: true }).select('-password').exec();
  }

  async deleteAdmin(id: string): Promise<IAdmin | null> {
    await this.ensureDB();
    return Admin.findByIdAndDelete(id).exec();
  }

  async countAdmins(): Promise<number> {
    await this.ensureDB();
    return Admin.countDocuments().exec();
  }

  async countSuperAdmins(): Promise<number> {
    await this.ensureDB();
    return Admin.countDocuments({ role: 'superadmin' }).exec();
  }

  async countPending(): Promise<number> {
    await this.ensureDB();
    return Admin.countDocuments({ status: 'pending' }).exec();
  }
}

export const adminRepository = new AdminRepository();
export default adminRepository;
