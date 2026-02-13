// User types for the admin user management feature

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  image?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | null;
  deletedAt?: string | null;
  _count?: {
    appointments: number;
  };
}

export type UserStatusFilter = "all" | "active" | "banned";

export interface AdminUsersParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: UserStatusFilter;
}

export interface AdminUsersResponse {
  success: boolean;
  data: {
    users: AdminUser[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface SingleUserResponse {
  success: boolean;
  data: {
    user: AdminUser;
  };
}

export interface UpdateUserParams {
  name?: string;
  role?: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: string;
}

export interface UpdateUserResponse {
  success: boolean;
  data: {
    user: AdminUser;
  };
}

export interface DeleteUserResponse {
  success: boolean;
  data: {
    message: string;
  };
}
