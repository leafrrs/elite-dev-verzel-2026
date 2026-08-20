async function run() {
  try {
    const loginRes = await fetch('http://localhost:3333/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizador@verzel.com.br', password: '123456' })
    });
    const { token } = await loginRes.json();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const payload = {
      title: "The Matrix via Script",
      description: "Teste de integridade",
      bannerUrl: "http://example.com/poster.jpg",
      date: futureDate.toISOString(),
      location: "Sala 1",
      price: 15.50,
      totalCapacity: 100,
      type: "SEATED",
      externalSource: "TMDB",
      externalId: "603"
    };

    const res = await fetch('http://localhost:3333/events', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    });

    console.log(res.status);
    console.log(await res.json());

  } catch (error) {
    console.error(error);
  }
}
run();
