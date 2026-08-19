import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

interface LoginParams {
  email: string;
  passwordStr: string;
}

import { env } from "../config/env";
import { AppError } from "../lib/AppError";

export class AuthService {
  async login({ email, passwordStr }: LoginParams) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError("E-mail ou senha incorretos", 401);
    }

    const isPasswordValid = await bcrypt.compare(
      passwordStr,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new AppError("E-mail ou senha incorretos", 401);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET,
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
