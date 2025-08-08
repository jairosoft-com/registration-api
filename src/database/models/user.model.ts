import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  emailVerified: boolean;
  active: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;

  // OAuth fields
  oauthProvider?: string;
  oauthProviderId?: string;

  // Two-factor authentication fields
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: Array<{
    code: string;
    used: boolean;
    usedAt?: Date;
  }>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  isLocked(): boolean;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: function (this: IUser) {
        // Password is required unless user is created via OAuth
        return !this.oauthProvider;
      },
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'First name must be at least 2 characters long'],
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters long'],
    },
    avatar: {
      type: String,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },

    // OAuth fields
    oauthProvider: {
      type: String,
      enum: ['google', 'github', 'facebook'],
    },
    oauthProviderId: {
      type: String,
    },

    // Two-factor authentication fields
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
    },
    twoFactorBackupCodes: [
      {
        code: {
          type: String,
          required: true,
        },
        used: {
          type: Boolean,
          default: false,
        },
        usedAt: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete (ret as any).password;
        delete (ret as any).twoFactorSecret;
        delete (ret as any).twoFactorBackupCodes;
        delete (ret as any).loginAttempts;
        delete (ret as any).lockUntil;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ oauthProvider: 1, oauthProviderId: 1 });
userSchema.index({ 'twoFactorBackupCodes.used': 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to hash backup codes
userSchema.pre('save', async function (next) {
  if (!this.isModified('twoFactorBackupCodes')) return next();

  try {
    if (this.twoFactorBackupCodes) {
      for (const backupCode of this.twoFactorBackupCodes) {
        if (!backupCode.code.startsWith('$2')) {
          // Only hash if not already hashed
          backupCode.code = await bcrypt.hash(backupCode.code, 12);
        }
      }
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    (updates as any).$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) }; // 2 hours
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Static method to find by OAuth provider
userSchema.statics.findByOAuthProvider = function (provider: string, providerId: string) {
  return this.findOne({ oauthProvider: provider, oauthProviderId: providerId });
};

// Static method to find by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for remaining backup codes
userSchema.virtual('remainingBackupCodes').get(function () {
  if (!this.twoFactorBackupCodes) return 0;
  return this.twoFactorBackupCodes.filter((code) => !code.used).length;
});

// Virtual for OAuth account info
userSchema.virtual('oauthAccount').get(function () {
  if (!this.oauthProvider) return null;

  return {
    provider: this.oauthProvider,
    providerId: this.oauthProviderId,
    verified: this.emailVerified,
  };
});

export const UserModel = mongoose.model<IUser>('User', userSchema);
