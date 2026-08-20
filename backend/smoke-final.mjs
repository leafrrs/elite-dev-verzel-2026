async function run() {
  try {
    const loginRes = await fetch('http://localhost:3333/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizador@verzel.com.br', password: '123456' })
    });
    const { token } = await loginRes.json();

    const searchRes = await fetch('http://localhost:3333/external/tmdb/search?query=matrix', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const searchStatus = searchRes.status;
    const searchJson = await searchRes.json();
    
    console.log("=== STATUS BUSCA ===");
    console.log(searchStatus);
    console.log("=== RESPOSTA BUSCA ===");
    // Amostra do 1o resultado sanitizado
    console.log(JSON.stringify(searchJson[0] || searchJson, null, 2));

    if (searchStatus !== 200 || !searchJson || searchJson.length === 0) return;

    const externalId = searchJson[0].externalId;
    const detailRes = await fetch(`http://localhost:3333/external/tmdb/${externalId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const detailStatus = detailRes.status;
    const detailJson = await detailRes.json();

    console.log("=== STATUS DETALHES ===");
    console.log(detailStatus);
    console.log("=== RESPOSTA DETALHES ===");
    console.log(JSON.stringify(detailJson, null, 2));

  } catch (error) {
    console.error(error);
  }
}
run();
