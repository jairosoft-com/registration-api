import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as LocalStrategy } from 'passport-local';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import logger from '@common/utils/logger';
import config from '@/config';
import { UserModel } from '../database/models/user.model';
import { eventService } from './event.service';
import { parseFullName } from '@common/utils/name.utils';

// Removed unused interfaces - they were declared but never used

class OAuthService {
  private strategies: Map<string, any> = new Map();

  /**
   * Initialize OAuth strategies
   */
  initialize(): void {
    this.setupGoogleStrategy();
    this.setupGitHubStrategy();
    this.setupFacebookStrategy();
    this.setupLocalStrategy();

    // Serialize user for session
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await UserModel.findById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });

    logger.info('OAuth strategies initialized');
  }

  /**
   * Setup Google OAuth strategy
   */
  private setupGoogleStrategy(): void {
    if (!config.oauth?.google?.clientId || !config.oauth?.google?.clientSecret) {
      logger.warn('Google OAuth credentials not configured');
      return;
    }

    const googleStrategy = new GoogleStrategy(
      {
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: `${config.baseUrl}/api/v1/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const user = await this.handleOAuthLogin(profile, 'google');
          done(null, user);
        } catch (error) {
          logger.error({ error }, 'Google OAuth error');
          done(error, null);
        }
      }
    );

    passport.use('google', googleStrategy);
    this.strategies.set('google', googleStrategy);
    logger.info('Google OAuth strategy configured');
  }

  /**
   * Setup GitHub OAuth strategy
   */
  private setupGitHubStrategy(): void {
    if (!config.oauth?.github?.clientId || !config.oauth?.github?.clientSecret) {
      logger.warn('GitHub OAuth credentials not configured');
      return;
    }

    const githubStrategy = new GitHubStrategy(
      {
        clientID: config.oauth.github.clientId,
        clientSecret: config.oauth.github.clientSecret,
        callbackURL: `${config.baseUrl}/api/v1/auth/github/callback`,
        scope: ['user:email'],
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const user = await this.handleOAuthLogin(profile, 'github');
          done(null, user);
        } catch (error) {
          logger.error({ error }, 'GitHub OAuth error');
          done(error, null);
        }
      }
    );

    passport.use('github', githubStrategy);
    this.strategies.set('github', githubStrategy);
    logger.info('GitHub OAuth strategy configured');
  }

  /**
   * Setup Facebook OAuth strategy
   */
  private setupFacebookStrategy(): void {
    if (!config.oauth?.facebook?.clientId || !config.oauth?.facebook?.clientSecret) {
      logger.warn('Facebook OAuth credentials not configured');
      return;
    }

    const facebookStrategy = new FacebookStrategy(
      {
        clientID: config.oauth.facebook.clientId,
        clientSecret: config.oauth.facebook.clientSecret,
        callbackURL: `${config.baseUrl}/api/v1/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'photos', 'email'],
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const user = await this.handleOAuthLogin(profile, 'facebook');
          done(null, user);
        } catch (error) {
          logger.error({ error }, 'Facebook OAuth error');
          done(error, null);
        }
      }
    );

    passport.use('facebook', facebookStrategy);
    this.strategies.set('facebook', facebookStrategy);
    logger.info('Facebook OAuth strategy configured');
  }

  /**
   * Setup Local strategy for username/password authentication
   */
  private setupLocalStrategy(): void {
    const localStrategy = new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email: string, password: string, done: any) => {
        try {
          const user = await UserModel.findOne({ email });

          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          // Check if 2FA is enabled
          if (user.twoFactorEnabled) {
            return done(null, false, {
              message: 'Two-factor authentication required',
              requires2FA: true,
              userId: user.id,
            });
          }

          done(null, user);
        } catch (error) {
          logger.error({ error }, 'Local authentication error');
          done(error as Error, null);
        }
      }
    );

    passport.use('local', localStrategy);
    this.strategies.set('local', localStrategy);
    logger.info('Local authentication strategy configured');
  }

  /**
   * Handle OAuth login
   */
  private async handleOAuthLogin(profile: any, provider: string): Promise<any> {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new Error(`No email found in ${provider} profile`);
    }

    // Check if user exists
    let user = await UserModel.findOne({ email });

    if (!user) {
      // Create new user
      const { firstName, lastName } = parseFullName(profile.displayName);

      user = await UserModel.create({
        email,
        firstName,
        lastName,
        password: await bcrypt.hash(Math.random().toString(36), 12), // Random password for OAuth users
        avatar: profile.photos?.[0]?.value,
        oauthProvider: provider,
        oauthProviderId: profile.id,
        emailVerified: profile.emails?.[0]?.verified || false,
      });

      logger.info(`New user created via ${provider} OAuth: ${email}`);

      // Emit user registration event
      await eventService.emitEvent(
        'user.registered',
        {
          email,
          provider,
          method: 'oauth',
        },
        user.id
      );
    } else {
      // Update existing user's OAuth info
      user.oauthProvider = provider;
      user.oauthProviderId = profile.id;
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      user.emailVerified = profile.emails?.[0]?.verified || user.emailVerified;
      await user.save();

      logger.info(`Existing user logged in via ${provider} OAuth: ${email}`);
    }

    // Emit login event
    await eventService.emitEvent(
      'user.logged_in',
      {
        email,
        provider,
        method: 'oauth',
      },
      user.id
    );

    return user;
  }

  /**
   * Generate JWT token for OAuth user
   */
  generateToken(user: any): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        provider: user.oauthProvider || 'local',
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );
  }

  /**
   * Get OAuth login URL
   */
  getOAuthUrl(provider: string): string {
    const urls: Record<string, string> = {
      google: '/api/v1/auth/google',
      github: '/api/v1/auth/github',
      facebook: '/api/v1/auth/facebook',
    };

    return urls[provider] || '';
  }

  /**
   * Get available OAuth providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Check if provider is configured
   */
  isProviderConfigured(provider: string): boolean {
    return this.strategies.has(provider);
  }

  /**
   * Get user's OAuth accounts
   */
  async getUserOAuthAccounts(userId: string): Promise<any[]> {
    const user = await UserModel.findById(userId);
    if (!user) return [];

    const accounts = [];

    if (user.oauthProvider) {
      accounts.push({
        provider: user.oauthProvider,
        providerId: user.oauthProviderId,
        verified: user.emailVerified,
      });
    }

    return accounts;
  }

  /**
   * Link OAuth account to existing user
   */
  async linkOAuthAccount(userId: string, provider: string, providerId: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.oauthProvider = provider;
    user.oauthProviderId = providerId;
    await user.save();

    logger.info(`OAuth account linked for user ${userId}: ${provider}`);
  }

  /**
   * Unlink OAuth account
   */
  async unlinkOAuthAccount(userId: string, provider: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.oauthProvider === provider) {
      user.oauthProvider = undefined;
      user.oauthProviderId = undefined;
      await user.save();

      logger.info(`OAuth account unlinked for user ${userId}: ${provider}`);
    }
  }

  /**
   * Get passport instance
   */
  getPassport(): typeof passport {
    return passport;
  }
}

// Export singleton instance
export const oauthService = new OAuthService();
export default oauthService;
