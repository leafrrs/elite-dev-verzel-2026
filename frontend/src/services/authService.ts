import { fetchApi } from './api';
import type { AuthResponse } from '../types/auth';

export const authService = {
  // Recebe email e password e devolve a Promise tipada com a AuthResponse
  async login(email: string, passwordStr: string): Promise<AuthResponse> {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: passwordStr }),
    });
  },
};
