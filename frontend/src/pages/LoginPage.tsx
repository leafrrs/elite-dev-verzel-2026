import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import './Login.scss';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados da requisição
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); // Impede o recarregamento automático da página
    setErrorMsg(null);
    setIsLoading(true);

    try {
      // 1. Chama o serviço puramente focado em HTTP
      const response = await authService.login(email, password);
      
      // 2. Passa a resposta de sucesso para o Contexto (salvar estado e localStorage)
      signIn(response);
      
      // 3. Redireciona com base no papel do usuário
      const role = response.user.role;
      if (role === 'ORGANIZER') {
        navigate('/organizer');
      } else if (role === 'GATE_STAFF') {
        navigate('/gate');
      } else {
        navigate('/'); // CLIENT
      }
    } catch (err: any) {
      // Trata erros sem vazar stack trace
      if (err.status === 401) {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (err.status === 400) {
        setErrorMsg('Formato de e-mail ou senha inválidos.');
      } else {
        setErrorMsg('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container login-container">
      <div className="login-box">
        <h1>Login</h1>
        <p>Acesse a plataforma de eventos</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@verzel.com.br"
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
              disabled={isLoading}
            />
          </div>

          {errorMsg && <div className="error-message">{errorMsg}</div>}

          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
