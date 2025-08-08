import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import logger from '@common/utils/logger';
import config from '@/config';
import { UserModel } from '../database/models/user.model';
import { eventService } from './event.service';

interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface TwoFactorVerification {
  token: string;
  backupCode?: string;
}

class TwoFactorService {
  private readonly issuer = 'Express Template';
  private readonly algorithm = 'sha1';
  private readonly digits = 6;
  private readonly period = 30;
  private readonly window = 2; // Allow 2 time steps for clock skew

  /**
   * Generate 2FA secret for user
   */
  async generateSecret(userId: string, userEmail: string): Promise<TwoFactorSecret> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${userEmail} (${this.issuer})`,
      issuer: this.issuer,
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store secret in user document
    await UserModel.findByIdAndUpdate(userId, {
      twoFactorSecret: secret.base32,
      twoFactorBackupCodes: backupCodes.map((code) => ({
        code: bcrypt.hashSync(code, 12),
        used: false,
      })),
      twoFactorEnabled: false, // Will be enabled after verification
    });

    logger.info(`2FA secret generated for user ${userId}`);

    return {
      secret: secret.base32!,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify 2FA token
   */
  async verifyToken(userId: string, verification: TwoFactorVerification): Promise<boolean> {
    const user = await UserModel.findById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new Error('2FA not set up for this user');
    }

    // Check if backup code is being used
    if (verification.backupCode) {
      return this.verifyBackupCode(user, verification.backupCode);
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: verification.token,
      window: this.window,
      algorithm: this.algorithm,
      digits: this.digits,
      step: this.period,
    });

    if (verified) {
      logger.info(`2FA token verified for user ${userId}`);

      // Emit 2FA verification event
      await eventService.emitEvent(
        'user.2fa_verified',
        {
          method: 'totp',
          timestamp: new Date().toISOString(),
        },
        userId
      );
    }

    return verified;
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(user: any, backupCode: string): Promise<boolean> {
    const backupCodes = user.twoFactorBackupCodes || [];

    for (let i = 0; i < backupCodes.length; i++) {
      const storedCode = backupCodes[i];

      if (!storedCode.used && bcrypt.compareSync(backupCode, storedCode.code)) {
        // Mark backup code as used
        storedCode.used = true;
        storedCode.usedAt = new Date();
        await user.save();

        logger.info(`Backup code used for user ${user.id}`);

        // Emit 2FA verification event
        await eventService.emitEvent(
          'user.2fa_verified',
          {
            method: 'backup_code',
            timestamp: new Date().toISOString(),
          },
          user.id
        );

        return true;
      }
    }

    return false;
  }

  /**
   * Enable 2FA for user
   */
  async enableTwoFactor(userId: string, verification: TwoFactorVerification): Promise<void> {
    const isValid = await this.verifyToken(userId, verification);

    if (!isValid) {
      throw new Error('Invalid 2FA token');
    }

    await UserModel.findByIdAndUpdate(userId, {
      twoFactorEnabled: true,
    });

    logger.info(`2FA enabled for user ${userId}`);

    // Emit 2FA enabled event
    await eventService.emitEvent(
      'user.2fa_enabled',
      {
        timestamp: new Date().toISOString(),
      },
      userId
    );
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(userId: string, verification: TwoFactorVerification): Promise<void> {
    const isValid = await this.verifyToken(userId, verification);

    if (!isValid) {
      throw new Error('Invalid 2FA token');
    }

    await UserModel.findByIdAndUpdate(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      twoFactorBackupCodes: undefined,
    });

    logger.info(`2FA disabled for user ${userId}`);

    // Emit 2FA disabled event
    await eventService.emitEvent(
      'user.2fa_disabled',
      {
        timestamp: new Date().toISOString(),
      },
      userId
    );
  }

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(
    userId: string,
    verification: TwoFactorVerification
  ): Promise<string[]> {
    const isValid = await this.verifyToken(userId, verification);

    if (!isValid) {
      throw new Error('Invalid 2FA token');
    }

    const backupCodes = this.generateBackupCodes();

    await UserModel.findByIdAndUpdate(userId, {
      twoFactorBackupCodes: backupCodes.map((code) => ({
        code: bcrypt.hashSync(code, 12),
        used: false,
      })),
    });

    logger.info(`New backup codes generated for user ${userId}`);

    // Emit backup codes regenerated event
    await eventService.emitEvent(
      'user.2fa_backup_codes_regenerated',
      {
        timestamp: new Date().toISOString(),
      },
      userId
    );

    return backupCodes;
  }

  /**
   * Get remaining backup codes
   */
  async getRemainingBackupCodes(userId: string): Promise<number> {
    const user = await UserModel.findById(userId);
    if (!user || !user.twoFactorBackupCodes) {
      return 0;
    }

    return user.twoFactorBackupCodes.filter((code) => !code.used).length;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Generate 2FA JWT token
   */
  generateTwoFactorToken(userId: string, email: string): string {
    return jwt.sign(
      {
        userId,
        email,
        type: '2fa',
        iat: Date.now(),
      },
      config.jwt.secret,
      { expiresIn: '5m' } // Short-lived token for 2FA
    );
  }

  /**
   * Verify 2FA JWT token
   */
  verifyTwoFactorToken(token: string): any {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      if (decoded.type !== '2fa') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch {
      throw new Error('Invalid 2FA token');
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await UserModel.findById(userId);
    return user?.twoFactorEnabled || false;
  }

  /**
   * Get 2FA status for user
   */
  async getTwoFactorStatus(userId: string): Promise<any> {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      enabled: user.twoFactorEnabled || false,
      hasSecret: !!user.twoFactorSecret,
      remainingBackupCodes: user.twoFactorBackupCodes?.filter((code) => !code.used).length || 0,
      totalBackupCodes: user.twoFactorBackupCodes?.length || 0,
    };
  }

  /**
   * Validate TOTP token format
   */
  validateTokenFormat(token: string): boolean {
    return /^\d{6}$/.test(token);
  }

  /**
   * Get current TOTP token for testing
   */
  getCurrentToken(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
      algorithm: this.algorithm,
      digits: this.digits,
      step: this.period,
    });
  }

  /**
   * Generate QR code for secret
   */
  async generateQRCode(secret: string, userEmail: string): Promise<string> {
    const otpauthUrl = speakeasy.otpauthURL({
      secret,
      label: userEmail,
      issuer: this.issuer,
      algorithm: this.algorithm,
      digits: this.digits,
      // IMPORTANT: The 'step' property is not supported by the speakeasy library's otpauthURL method
      // even though it's a valid TOTP parameter. This is a known limitation of speakeasy v2.x.
      // The library uses the 'period' parameter internally but doesn't expose it in otpauthURL.
      // See: https://github.com/speakeasy-js/speakeasy/issues/110
      // Workaround: The default 30-second period is used, which is standard for most TOTP implementations.
      // step: this.period, // Would be the correct property name per TOTP spec
    });

    return QRCode.toDataURL(otpauthUrl);
  }

  /**
   * Clean up expired backup codes
   */
  async cleanupExpiredBackupCodes(): Promise<void> {
    const users = await UserModel.find({
      'twoFactorBackupCodes.used': true,
    });

    let cleanedCount = 0;

    for (const user of users) {
      const originalCount = user.twoFactorBackupCodes?.length || 0;

      // Remove used backup codes older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      user.twoFactorBackupCodes = user.twoFactorBackupCodes?.filter((code) => {
        if (!code.used) return true;
        if (!code.usedAt) return false;
        return code.usedAt > thirtyDaysAgo;
      });

      if (user.twoFactorBackupCodes?.length !== originalCount) {
        await user.save();
        cleanedCount += originalCount - (user.twoFactorBackupCodes?.length || 0);
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired backup codes`);
    }
  }

  /**
   * Get 2FA statistics
   */
  async getTwoFactorStatistics(): Promise<any> {
    const totalUsers = await UserModel.countDocuments();
    const usersWith2FA = await UserModel.countDocuments({ twoFactorEnabled: true });
    const usersWithSecret = await UserModel.countDocuments({ twoFactorSecret: { $exists: true } });

    return {
      totalUsers,
      usersWith2FA,
      usersWithSecret,
      twoFactorAdoptionRate: totalUsers > 0 ? (usersWith2FA / totalUsers) * 100 : 0,
    };
  }
}

// Export singleton instance
export const twoFactorService = new TwoFactorService();
export default twoFactorService;
