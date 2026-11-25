import type { BannerEntity, BannerRepositoryPort } from '../domain/banner.repository.js';

export class BannerService {
  constructor(private readonly bannerRepo: BannerRepositoryPort) {}

  listForStore(): Promise<readonly BannerEntity[]> {
    return this.bannerRepo.listActiveForStore();
  }
}
