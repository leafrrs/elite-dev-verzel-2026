import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Apenas um tipo para organizar o que vamos receber do Controller no Login
interface LoginParams {
  email: string;
  passwordStr: string; // Usamos passwordStr para deixar claro que é a senha crua digitada
}

export class AuthService {
  
  // O método "login" recebe as informações e executa a lógica que conversamos
  async login({ email, passwordStr }: LoginParams) {
    
    // 1. O e-mail existe no banco?
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Se não encontrou, lançamos um erro. O Controller vai pegar esse erro e devolver 401.
      throw new Error('E-mail ou senha incorretos');
    }

    // 2. A senha digitada (passwordStr) bate com a criptografada (user.passwordHash)?
    const isPasswordValid = await bcrypt.compare(passwordStr, user.passwordHash);

    if (!isPasswordValid) {
      // Mesma mensagem de erro (não damos dicas a hackers se foi o e-mail ou a senha que errou)
      throw new Error('E-mail ou senha incorretos');
    }

    // 3. Tudo certo! Vamos gerar o Token JWT
    // Verificamos se a chave secreta existe no .env (segurança)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('Aviso para o desenvolvedor: JWT_SECRET não configurado no .env');
    }

    // O Token vai "carregar" o ID e a Role do usuário dentro dele (o Payload)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // Padrão de 7 dias se não estiver no .env
    );

    // 4. Retornamos o token e os dados públicos do usuário (NUNCA devolvemos a senha)
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
