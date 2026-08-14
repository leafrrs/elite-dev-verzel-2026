import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o Seed do Banco de Dados...');

  // 1. Limpeza prévia na ordem correta para respeitar Foreign Keys
  await prisma.ticket.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.seat.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Banco limpo com sucesso.');

  // 2. Criação do Hash de senha padrão (123456)
  const passwordHash = await bcrypt.hash('123456', 8);

  // 3. Criando os 4 Usuários Obrigatórios do Desafio
  const organizer = await prisma.user.create({
    data: {
      name: 'Carlos Organizador',
      email: 'organizador@verzel.com.br',
      passwordHash,
      role: 'ORGANIZER',
    },
  });

  const client1 = await prisma.user.create({
    data: {
      name: 'Ana Cliente',
      email: 'cliente1@verzel.com.br',
      passwordHash,
      role: 'CLIENT',
    },
  });

  const client2 = await prisma.user.create({
    data: {
      name: 'Bruno Cliente',
      email: 'cliente2@verzel.com.br',
      passwordHash,
      role: 'CLIENT',
    },
  });

  const gateStaff = await prisma.user.create({
    data: {
      name: 'Marcos Portaria',
      email: 'portaria@verzel.com.br',
      passwordHash,
      role: 'GATE_STAFF',
    },
  });

  console.log('👤 Usuários criados:');
  console.log(`  - Organizador: ${organizer.email} (senha: 123456)`);
  console.log(`  - Cliente 1:   ${client1.email} (senha: 123456)`);
  console.log(`  - Cliente 2:   ${client2.email} (senha: 123456)`);
  console.log(`  - Portaria:    ${gateStaff.email} (senha: 123456)`);

  // 4. Criando Evento 1: Cinema / Sessão de Filme (Mapa de Assentos)
  const movieEvent = await prisma.event.create({
    data: {
      title: 'Interestelar — Exibição Especial IMAX',
      description: 'Uma equipe de exploradores viaja através de um buraco de minhoca no espaço, na tentativa de garantir a sobrevivência da humanidade.',
      bannerUrl: 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Daqui a 7 dias
      location: 'Cineplex IMAX - Sala 01 (Shopping Central)',
      price: 45.0,
      type: 'SEATED',
      totalCapacity: 16,
      availableStock: 16,
      externalSource: 'TMDB',
      externalId: '157336', // ID do Interstellar no TMDb
      organizerId: organizer.id,
    },
  });

  // Gerando os 16 assentos (Fileira A: A1..A8 / Fileira B: B1..B8)
  const rows = ['A', 'B'];
  const seatsData = [];

  for (const row of rows) {
    for (let num = 1; num <= 8; num++) {
      seatsData.push({
        eventId: movieEvent.id,
        seatCode: `${row}${num}`,
        status: 'AVAILABLE',
      });
    }
  }

  // Inserindo todos os assentos no banco
  for (const seat of seatsData) {
    await prisma.seat.create({ data: seat });
  }

  console.log(`🎬 Evento com Assentos criado: "${movieEvent.title}" (16 assentos gerados)`);

  // 5. Criando Evento 2: Show / Festival (Pista por Quantidade)
  const concertEvent = await prisma.event.create({
    data: {
      title: 'Coldplay — Music of the Spheres Tour',
      description: 'A aclamada turnê mundial sustentável do Coldplay com show de luzes e grandes sucessos.',
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop',
      date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Daqui a 15 dias
      location: 'Estádio Allianz Parque - São Paulo, SP',
      price: 280.0,
      type: 'GENERAL_ADMISSION',
      totalCapacity: 150,
      availableStock: 150,
      externalSource: 'TICKETMASTER',
      externalId: 'vvG1YZ94bX-np',
      organizerId: organizer.id,
    },
  });

  console.log(`🎸 Evento de Pista criado: "${concertEvent.title}" (150 ingressos disponíveis)`);

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
