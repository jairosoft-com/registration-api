import mongoose, { Document, Schema } from 'mongoose';

export interface IRegistration extends Document {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  schedule: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  emailSent: boolean;
  adminNotificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<IRegistration>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => `reg_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'First name must be at least 2 characters long'],
      maxlength: [50, 'First name must be at most 50 characters long'],
      match: [/^[a-zA-Z\s]+$/, 'First name must contain only letters and spaces'],
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters long'],
      maxlength: [50, 'Last name must be at most 50 characters long'],
      match: [/^[a-zA-Z\s]+$/, 'Last name must contain only letters and spaces'],
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      index: true,
    },
    schedule: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'confirmed',
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    adminNotificationSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Index for preventing duplicates
registrationSchema.index({ email: 1 }, { unique: false });

// Static method to find by email
registrationSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to check for duplicates
registrationSchema.statics.isDuplicate = async function (email: string): Promise<boolean> {
  const existing = await this.findOne({ email: email.toLowerCase() });
  return !!existing;
};

export const RegistrationModel = mongoose.model<IRegistration>('Registration', registrationSchema);
