import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

const authService = new AuthService();

export class AuthController {
  
  // Como é uma chamada de rede (HTTP), a função precisa ser async (assíncrona)
  async login(req: Request, res: Response) {
    try {
      // 1. Pegamos os dados que o Front-End enviou no corpo da requisição (req.body)
      const { email, password } = req.body;

      // Se o usuário esqueceu de mandar e-mail ou senha, já barramos aqui (Erro 400 - Bad Request)
      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
      }

      // 2. Chamamos o "cérebro" (o Service que acabamos de criar) e passamos os dados
      // Se der erro lá dentro (ex: senha errada), ele vai cair no bloco 'catch' abaixo
      const result = await authService.login({ email, passwordStr: password });

      // 3. Se chegou aqui, o Service trabalhou direitinho. Devolvemos os dados para o Front-End (Status 200 - OK)
      return res.status(200).json(result);

    } catch (error: any) {
      // 4. Se o Service avisou que algo deu errado, caímos aqui.
      // Retornamos 401 (Unauthorized) porque é um erro de login.
      return res.status(401).json({ error: error.message });
    }
  }
}
