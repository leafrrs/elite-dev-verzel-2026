// import.meta.env é a forma que o Vite usa para acessar variáveis do .env
const API_URL = import.meta.env.VITE_API_URL;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Configuração base combinando a URL e headers padrão (como JSON)
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Tenta ler o JSON do erro do backend (ex: { "error": "Credenciais inválidas" })
    const errorData = await response.json().catch(() => null);
    throw {
      status: response.status,
      data: errorData,
    };
  }

  // Se não tem corpo de resposta (ex: 204), não dá erro ao parsear JSON
  if (response.status === 204) return null;
  
  return response.json();
}
