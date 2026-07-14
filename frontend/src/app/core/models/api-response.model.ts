export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiListResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorField {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: ApiErrorField[];
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  sort?: string;
  [key: string]: string | number | boolean | undefined;
}
