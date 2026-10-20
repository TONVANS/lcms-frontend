export type ID = string;
export type ISODate = string;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}
