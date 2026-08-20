async function run() {
  try {
    // 1. Obter Token (login as ORGANIZER)
    const loginRes = await fetch('http://localhost:3333/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizador@verzel.com.br', password: '123456' })
    });
    const { token } = await loginRes.json();

    // 2. Busca de filme 'matrix'
    const searchRes = await fetch('http://localhost:3333/external/tmdb/search?query=matrix', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const searchStatus = searchRes.status;
    const searchJson = await searchRes.json();
    
    console.log("=== STATUS BUSCA ===");
    console.log(searchStatus);
    console.log("=== RESPOSTA BUSCA (amostra do 1º resultado) ===");
    console.log(JSON.stringify(searchJson[0] || searchJson, null, 2));

    if (searchStatus !== 200 || !searchJson || searchJson.length === 0) {
      console.log("Nenhum resultado válido retornado.");
      return;
    }

    // 3. Pegar externalId e buscar detalhes
    const externalId = searchJson[0].externalId;
    const detailRes = await fetch(`http://localhost:3333/external/tmdb/${externalId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const detailStatus = detailRes.status;
    const detailJson = await detailRes.json();

    console.log("=== STATUS DETALHES ===");
    console.log(detailStatus);
    console.log("=== RESPOSTA DETALHES ===");
    console.log(JSON.stringify(detailJson, null, 2));

  } catch (error) {
    console.error("Erro durante o smoke test:", error);
  }
}

run();
