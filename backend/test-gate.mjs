import fs from 'fs';

async function req(method, path, body, token) {
  const res = await fetch('http://localhost:3333' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  const status = res.status;
  const json = await res.json().catch(() => null);
  return { status, json };
}

async function run() {
  console.log("--- TESTE E2E PORTARIA ---");

  // 1. Obter Eventos
  const { json: events } = await req('GET', '/events');
  const event1 = events.find(e => e.type === 'SEATED');
  const event2 = events.find(e => e.type === 'GENERAL_ADMISSION');
  
  console.log("\n-> Login CLIENT");
  let { json: authClient } = await req('POST', '/auth/login', { email: 'cliente1@verzel.com.br', password: '123456' });
  const tokenClient = authClient.token;
  
  console.log("\n-> Comprando Ticket 1 (SEATED)");
  const res1 = await req('POST', '/reservations', { eventId: event1.id, seatCode: 'B7' }, tokenClient);
  if (res1.status === 201) {
    await req('POST', `/reservations/${res1.json.reservation.id}/pay`, { approved: true }, tokenClient);
  }
  
  console.log("-> Comprando Ticket 2 (GENERAL)");
  const res2 = await req('POST', '/reservations', { eventId: event2.id }, tokenClient);
  if (res2.status === 201) {
    await req('POST', `/reservations/${res2.json.reservation.id}/pay`, { approved: true }, tokenClient);
  }
  
  const { json: tickets } = await req('GET', '/tickets/me', null, tokenClient);
  
  const ticket1 = tickets.find(t => t.eventId === event1.id && t.status === 'VALID');
  const ticket2 = tickets.find(t => t.eventId === event2.id && t.status === 'VALID');
  
  if (!ticket1 || !ticket2) {
    console.log("NÃO FOI POSSÍVEL ENCONTRAR TICKETS VÁLIDOS", tickets);
    return;
  }
  
  console.log("\n-> Login GATE_STAFF");
  const { json: authGate } = await req('POST', '/auth/login', { email: 'portaria@verzel.com.br', password: '123456' });
  const tokenGate = authGate.token;
  
  console.log("\n[TESTE 2] -> Validando Ticket 1 (VALID + Evento Correto + Hash Correto)");
  const resValid = await req('POST', '/tickets/validate', {
    ticketCode: ticket1.ticketCode,
    secureHash: ticket1.secureHash,
    eventId: event1.id
  }, tokenGate);
  console.log(`HTTP ${resValid.status}:`, resValid.json);

  console.log("\n[TESTE 3] -> Validando Ticket 1 NOVAMENTE (Mesmo Ticket)");
  const resUsed = await req('POST', '/tickets/validate', {
    ticketCode: ticket1.ticketCode,
    secureHash: ticket1.secureHash,
    eventId: event1.id
  }, tokenGate);
  console.log(`HTTP ${resUsed.status}:`, resUsed.json);

  console.log("\n[TESTE 4] -> Validando Ticket 2 (Hash Alterado)");
  const tamperedHash = ticket2.secureHash.substring(0, ticket2.secureHash.length - 2) + '00';
  const resTampered = await req('POST', '/tickets/validate', {
    ticketCode: ticket2.ticketCode,
    secureHash: tamperedHash,
    eventId: event2.id
  }, tokenGate);
  console.log(`HTTP ${resTampered.status}:`, resTampered.json);

  console.log("\n[TESTE 5] -> Validando Ticket 2 (Evento Errado - Portaria no Evento 1)");
  const resWrongEvent = await req('POST', '/tickets/validate', {
    ticketCode: ticket2.ticketCode,
    secureHash: ticket2.secureHash,
    eventId: event1.id
  }, tokenGate);
  console.log(`HTTP ${resWrongEvent.status}:`, resWrongEvent.json);

  console.log("\n[TESTE 6] -> Validando ticketCode Inexistente");
  const resNotFound = await req('POST', '/tickets/validate', {
    ticketCode: "FAKE-123",
    secureHash: ticket2.secureHash,
    eventId: event1.id
  }, tokenGate);
  console.log(`HTTP ${resNotFound.status}:`, resNotFound.json);

  console.log("\n[TESTE 7] -> CLIENT tentando validar");
  const resClientGate = await req('POST', '/tickets/validate', { ticketCode: 'x', secureHash: 'y', eventId: 'z' }, tokenClient);
  console.log(`HTTP ${resClientGate.status}:`, resClientGate.json);

  console.log("\n[TESTE 8] -> Login ORGANIZER");
  const { json: authOrg } = await req('POST', '/auth/login', { email: 'organizador@verzel.com.br', password: '123456' });
  console.log("-> ORGANIZER tentando validar");
  const resOrgGate = await req('POST', '/tickets/validate', { ticketCode: 'x', secureHash: 'y', eventId: 'z' }, authOrg.token);
  console.log(`HTTP ${resOrgGate.status}:`, resOrgGate.json);

  console.log("\n[TESTE 9] -> CLIENT carrega Meus Ingressos (F5)");
  const { json: ticketsFinal } = await req('GET', '/tickets/me', null, tokenClient);
  const ticket1Final = ticketsFinal.find(t => t.id === ticket1.id);
  const ticket2Final = ticketsFinal.find(t => t.id === ticket2.id);
  
  console.log(`Status do Ticket 1 (consumido): ${ticket1Final.status}`);
  console.log(`Status do Ticket 2 (apenas rejeitado/nao consumido): ${ticket2Final.status}`);
}

run();
