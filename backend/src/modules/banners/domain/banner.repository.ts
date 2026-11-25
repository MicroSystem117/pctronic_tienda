export interface BannerEntity {
  readonly banner_id: number;
  readonly badge_text: string | null;
  readonly title: string;
  readonly highlight_text: string | null;
  readonly subtitle: string | null;
  readonly image_url: string;
  readonly image_alt: string;
  readonly cta_label: string;
  readonly cta_url: string;
  readonly color_start: string;
  readonly color_end: string;
  readonly gradient_angle: number;
  readonly display_order: number;
}

export interface BannerRepositoryPort {
  listActiveForStore(channel?: string): Promise<readonly BannerEntity[]>;
}
