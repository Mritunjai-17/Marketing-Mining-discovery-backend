import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminRepository, AdminRepository } from '@/repositories/admin.repository';
import { IAdmin, AdminRole, AdminStatus } from '@/models/admin.model';

export interface AdminPayload {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResult {
  admin: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    status: AdminStatus;
    createdAt: Date;
  };
  token?: string;
  isPendingApproval?: boolean;
  message?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'mining_discovery_default_jwt_secret_2026';

export class AuthService {
  private repository: AdminRepository;

  constructor(repository: AdminRepository = adminRepository) {
    this.repository = repository;
  }

  generateToken(admin: IAdmin): string {
    const payload: AdminPayload = {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d',
    });
  }

  verifyToken(token: string): AdminPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as AdminPayload;
    } catch {
      throw new Error('Invalid or expired authentication token');
    }
  }

  async register(data: RegisterDTO): Promise<AuthResult> {
    const name = (data.name || '').trim();
    const email = (data.email || '').trim().toLowerCase();
    const password = data.password || '';

    if (!name || name.length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('Please provide a valid email address');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if email already registered
    const existing = await this.repository.findByEmail(email);
    if (existing) {
      if (existing.status === 'pending') {
        throw new Error('This email has already registered and is currently awaiting Super Admin approval.');
      }
      throw new Error('An admin with this email is already registered.');
    }

    // Count existing admins and superadmins
    const totalAdmins = await this.repository.countAdmins();
    const totalSuperAdmins = await this.repository.countSuperAdmins();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Rule: The very first registered admin (or if no superadmin exists) is Super Admin with instant approval
    if (totalAdmins === 0 || totalSuperAdmins === 0) {
      const superAdmin = await this.repository.create({
        name,
        email,
        password: hashedPassword,
        role: 'superadmin',
        status: 'approved',
        approvedBy: 'System Bootstrap',
        approvedAt: new Date(),
      });

      const token = this.generateToken(superAdmin);

      return {
        admin: {
          id: superAdmin._id.toString(),
          name: superAdmin.name,
          email: superAdmin.email,
          role: superAdmin.role,
          status: superAdmin.status,
          createdAt: superAdmin.createdAt,
        },
        token,
        isPendingApproval: false,
        message: 'Super Administrator account created and approved.',
      };
    }

    // Subsequent admins are created with status: 'pending' and require Super Admin approval
    const pendingAdmin = await this.repository.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      status: 'pending',
    });

    return {
      admin: {
        id: pendingAdmin._id.toString(),
        name: pendingAdmin.name,
        email: pendingAdmin.email,
        role: pendingAdmin.role,
        status: pendingAdmin.status,
        createdAt: pendingAdmin.createdAt,
      },
      isPendingApproval: true,
      message: 'Registration submitted successfully. The Super Admin must approve your access before you can log in.',
    };
  }

  async login(data: LoginDTO): Promise<AuthResult> {
    const email = (data.email || '').trim().toLowerCase();
    const password = data.password || '';

    if (!email || !password) {
      throw new Error('Please enter both email and password');
    }

    const admin = await this.repository.findByEmail(email);
    if (!admin) {
      throw new Error('Invalid email or password');
    }

    // Verify password first
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Check account approval status
    if (admin.status === 'pending') {
      throw new Error('Account Pending Approval: The Super Admin has not approved your access yet. Please contact your Super Admin.');
    }

    if (admin.status === 'rejected') {
      throw new Error('Access Denied: Your admin access request was rejected by the Super Admin.');
    }

    await this.repository.updateLastLogin(admin._id.toString());
    const token = this.generateToken(admin);

    return {
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        createdAt: admin.createdAt,
      },
      token,
      isPendingApproval: false,
    };
  }

  async getAdminProfile(id: string) {
    const admin = await this.repository.findById(id);
    if (!admin) {
      throw new Error('Admin account not found');
    }

    return {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt,
    };
  }

  // Super Admin Management Methods
  async getAdminsList(requesterRole: string) {
    if (requesterRole !== 'superadmin') {
      throw new Error('Unauthorized: Only Super Administrators can view and manage admin access.');
    }

    const admins = await this.repository.findAll();
    const pendingCount = await this.repository.countPending();

    return {
      admins,
      pendingCount,
    };
  }

  async updateAdminStatus(
    targetAdminId: string,
    newStatus: AdminStatus,
    superAdminName: string,
    requesterRole: string
  ) {
    if (requesterRole !== 'superadmin') {
      throw new Error('Unauthorized: Only Super Administrators can grant or revoke admin access.');
    }

    const target = await this.repository.findById(targetAdminId);
    if (!target) {
      throw new Error('Admin account not found');
    }

    if (target.role === 'superadmin') {
      throw new Error('Cannot change access status of a Super Administrator.');
    }

    const updated = await this.repository.updateStatus(targetAdminId, newStatus, superAdminName);
    return updated;
  }

  async deleteAdmin(targetAdminId: string, currentSuperAdminId: string, requesterRole: string) {
    if (requesterRole !== 'superadmin') {
      throw new Error('Unauthorized: Only Super Administrators can delete admin accounts.');
    }

    if (targetAdminId === currentSuperAdminId) {
      throw new Error('You cannot delete your own Super Administrator account.');
    }

    const target = await this.repository.findById(targetAdminId);
    if (!target) {
      throw new Error('Admin account not found');
    }

    return this.repository.deleteAdmin(targetAdminId);
  }

  async getSetupStatus(): Promise<{ isFirstAdmin: boolean; superAdminExists: boolean; totalAdmins: number }> {
    const totalAdmins = await this.repository.countAdmins();
    const superAdminCount = await this.repository.countSuperAdmins();
    return {
      isFirstAdmin: totalAdmins === 0 || superAdminCount === 0,
      superAdminExists: superAdminCount > 0,
      totalAdmins,
    };
  }
}

export const authService = new AuthService();
export default authService;
