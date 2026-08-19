import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

interface LoginParams {
  email: string;
  passwordStr: string;
}

export class AuthService {
  async login({ email, passwordStr }: LoginParams) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("E-mail ou senha incorretos");
    }

    const isPasswordValid = await bcrypt.compare(
      passwordStr,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new Error("E-mail ou senha incorretos");
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error(
        "Aviso para o desenvolvedor: JWT_SECRET não configurado no .env",
      );
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );

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
