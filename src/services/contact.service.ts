import {
  contactRepository,
  ContactRepository,
  ContactPaginationOptions,
  PaginatedResult,
  ContactStats,
} from '@/repositories/contact.repository';
import { IContact, ContactStatus } from '@/models/contact.model';
import { emailService } from '@/services/email.service';

export interface SubmitContactDTO {
  name: string;
  email: string;
  phone?: string;
  message: string;
  ipAddress?: string;
  userAgent?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ContactService {
  private repository: ContactRepository;

  constructor(repository: ContactRepository = contactRepository) {
    this.repository = repository;
  }

  async submitContact(data: SubmitContactDTO): Promise<IContact> {
    const name = (data.name || '').trim();
    const email = (data.email || '').trim().toLowerCase();
    const phone = (data.phone || '').trim();
    const message = (data.message || '').trim();

    if (!name || name.length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new Error('A valid email address is required');
    }
    if (!message || message.length < 5) {
      throw new Error('Message must be at least 5 characters long');
    }
    if (message.length > 5000) {
      throw new Error('Message cannot exceed 5000 characters');
    }

    // Duplicate submission guard (checks if exact same message sent in the last 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentDuplicate = await this.repository.findOne({
      email,
      message,
      createdAt: { $gte: twoMinutesAgo },
    });

    if (recentDuplicate) {
      throw new Error('Duplicate submission detected. Please wait before submitting again.');
    }

    const created = await this.repository.create({
      name,
      email,
      phone,
      message,
      status: 'new',
      ipAddress: data.ipAddress || '',
      userAgent: data.userAgent || '',
    });

    // Trigger Resend email notifications (Thank-you to client + Alert to admin)
    // Dispatched asynchronously in background so client response is instant
    emailService.sendContactEmails({
      id: created._id.toString(),
      name: created.name,
      email: created.email,
      phone: created.phone,
      message: created.message,
      createdAt: created.createdAt,
    }).catch((err) => {
      console.error('[ContactService] Background email dispatch failed:', err);
    });

    return created;
  }

  async getContacts(options: ContactPaginationOptions): Promise<PaginatedResult<IContact>> {
    return this.repository.findWithPagination(options);
  }

  async getContactById(id: string): Promise<IContact> {
    const contact = await this.repository.findById(id);
    if (!contact) {
      throw new Error(`Inquiry with ID ${id} not found`);
    }

    // Auto-mark as 'read' if it was 'new' when viewed
    if (contact.status === 'new') {
      contact.status = 'read';
      await contact.save();
    }

    return contact;
  }

  async updateStatus(
    id: string,
    status: ContactStatus,
    adminNotes?: string
  ): Promise<IContact> {
    const allowedStatuses: ContactStatus[] = ['new', 'read', 'contacted', 'archived'];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status "${status}". Allowed: ${allowedStatuses.join(', ')}`);
    }

    const updated = await this.repository.updateStatus(id, status, adminNotes);
    if (!updated) {
      throw new Error(`Inquiry with ID ${id} not found`);
    }
    return updated;
  }

  async deleteContact(id: string): Promise<IContact> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error(`Inquiry with ID ${id} not found`);
    }
    return deleted;
  }

  async getStats(): Promise<ContactStats> {
    return this.repository.getStats();
  }
}

export const contactService = new ContactService();
export default contactService;
