const API_BASE_URL = `${window.location.origin.replace('3000','3001')}/api`;

export interface UserData {
  email: string;
  points: number;
  scannedBins: string[];
  photoCount: number;
}

export interface LoginResponse {
  success: boolean;
  user: {
    email: string;
    points: number;
  };
}

export interface ScanBinResponse {
  success: boolean;
  points: number;
  binId: string;
}

export interface PhotoUploadResponse {
  success: boolean;
  filename: string;
  photoCount: number;
  identificationResult?: string;
  photoInfo?: {
    filename: string;
    binId: string | null;
    timestamp: string;
    size: number;
    identificationResult?: string;
  };
}

export interface PhotoInfo {
  filename: string;
  binId: string | null;
  timestamp: string;
  size: number;
  identificationResult?: string;
}

export interface PhotosResponse {
  photos: PhotoInfo[];
  count: number;
}

class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getUserData(email: string): Promise<UserData> {
    return this.request<UserData>(`/user/${encodeURIComponent(email)}`);
  }

  async scanBin(email: string, binId: string): Promise<ScanBinResponse> {
    return this.request<ScanBinResponse>(`/user/${encodeURIComponent(email)}/scan-bin`, {
      method: 'POST',
      body: JSON.stringify({ binId }),
    });
  }

  async uploadPhoto(email: string, photoBlob: Blob, binId?: string): Promise<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('photo', photoBlob, 'photo.jpg');
    if (binId) {
      formData.append('binId', binId);
    }

    const response = await fetch(`${API_BASE_URL}/user/${encodeURIComponent(email)}/photos`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getPhotos(email: string): Promise<PhotosResponse> {
    return this.request<PhotosResponse>(`/user/${encodeURIComponent(email)}/photos`);
  }

  getPhotoUrl(email: string, filename: string): string {
    return `${API_BASE_URL}/user/${encodeURIComponent(email)}/photos/${filename}`;
  }

  async confirmPhoto(email: string, filename: string, photoInfo: any): Promise<{ success: boolean; photoCount: number }> {
    return this.request<{ success: boolean; photoCount: number }>(`/user/${encodeURIComponent(email)}/photos/${filename}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ photoInfo }),
    });
  }

  async cancelPhoto(email: string, filename: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/user/${encodeURIComponent(email)}/photos/${filename}/cancel`, {
      method: 'DELETE',
    });
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiClient = new ApiClient();