
export interface PromoCode {
  id?: string;
  code: string;
  discountType: 'percentage' | 'flat' | 'free_ticket';
  value: number;
  maxDiscount?: number; // For percentage based
  minOrderValue?: number;
  validFrom?: string | any;
  expiryDate: string | any;
  usageLimit?: number;
  usedCount: number;
  usesPerUser?: number; // max uses per individual user
  isActive: boolean;
  scope: 'global' | 'event';
  applicableEvents?: string[]; // Empty if global
  applicableTiers?: string[]; // Restrict to specific tiers
  createdBy?: string;
  createdAt?: any;
}

export interface PromoValidationResult {
  isValid: boolean;
  discountAmount: number;
  message?: string;
  promo?: PromoCode;
}
