import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AppError } from '../lib/AppError';
import { loginSchema } from '../schemas/authSchema';

const authService = new AuthService();

export class AuthController {
  
  async login(req: Request, res: Response) {
    try {
      const validation = loginSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: "Dados inválidos.",
          details: validation.error.flatten().fieldErrors
        });
      }

      const { email, password } = validation.data;

      const result = await authService.login({ email, passwordStr: password });

      return res.status(200).json(result);

    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      console.error(error);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  }
}
