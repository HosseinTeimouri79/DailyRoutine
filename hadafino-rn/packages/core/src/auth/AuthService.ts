import { apiClient, ApiError } from '../api/client';
import { storage, STORAGE_KEYS } from '../storage';
import { SyncQueue } from '../sync/SyncQueue';
import { SyncMetadataStore } from '../sync/SyncMetadataStore';
import type { AuthCredentials, AuthResponse, RegisterPayload, User } from '../types';

export class AuthService {
  static async login(credentials: AuthCredentials): Promise<AuthResponse> {
    const response = await apiClient.auth.login(credentials);
    this.persistSession(response);
    return response;
  }

  static async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.auth.register(payload);
    this.persistSession(response);
    return response;
  }

  static async logout(): Promise<void> {
    storage.remove(STORAGE_KEYS.AUTH_TOKEN);
    storage.remove(STORAGE_KEYS.AUTH_USER);
    await SyncQueue.clearAll();
    await SyncMetadataStore.resetAll();
  }

  static getToken(): string | null {
    return storage.getString(STORAGE_KEYS.AUTH_TOKEN);
  }

  static getUser(): User | null {
    return storage.get<User>(STORAGE_KEYS.AUTH_USER);
  }

  static isAuthenticated(): boolean {
    return Boolean(this.getToken() && this.getUser());
  }

  static async refreshProfile(): Promise<User> {
    const user = await apiClient.auth.getProfile();
    storage.set(STORAGE_KEYS.AUTH_USER, user);
    return user;
  }

  static async updateProfile(payload: Partial<User>): Promise<User> {
    const updated = await apiClient.auth.updateProfile(payload);
    storage.set(STORAGE_KEYS.AUTH_USER, updated);
    return updated;
  }

  static async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await apiClient.auth.changePassword(payload);
  }

  private static persistSession(response: AuthResponse): void {
    storage.setString(STORAGE_KEYS.AUTH_TOKEN, response.token);
    storage.set(STORAGE_KEYS.AUTH_USER, response.user);
  }
}
