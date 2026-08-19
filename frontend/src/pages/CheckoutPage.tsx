import { useParams } from 'react-router-dom';

export function CheckoutPage() {
  const { reservationId } = useParams<{ reservationId: string }>();

  return (
    <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
      <h1>Reserva criada com sucesso!</h1>
      <p style={{ marginTop: '16px', color: '#A0A0A0' }}>
        O ID da sua reserva é: <strong>{reservationId}</strong>
      </p>
      <p style={{ marginTop: '32px' }}>
        O pagamento será realizado na próxima etapa. (Fase F7)
      </p>
    </div>
  );
}
