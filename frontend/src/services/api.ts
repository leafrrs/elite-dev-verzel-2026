// import.meta.env é a forma que o Vite usa para acessar variáveis do .env
const API_URL = import.meta.env.VITE_API_URL;

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Busca o token persistido (não acopla o serviço ao ciclo de vida do React)
  const token = localStorage.getItem('@VerzelEvents:token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw {
      status: response.status,
      data: errorData,
    };
  }

  if (response.status === 204) return null as T;
  
  return response.json() as Promise<T>;
}
