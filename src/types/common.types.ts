// Common utility types
export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface SelectOption {
  value: string;
  label: string;
}

export interface MenuItem {
  label: string;
  path: string;
  icon?: string;
  children?: MenuItem[];
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface PriceRange {
  min: number;
  max: number;
}
