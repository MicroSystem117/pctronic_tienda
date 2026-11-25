import type { SettingsRepositoryPort, StoreSettingsEntity } from '../domain/settings.repository.js';

export class SettingsService {
  constructor(private readonly settingsRepo: SettingsRepositoryPort) {}

  getSettings(): Promise<StoreSettingsEntity> {
    return this.settingsRepo.getSettings();
  }
}
