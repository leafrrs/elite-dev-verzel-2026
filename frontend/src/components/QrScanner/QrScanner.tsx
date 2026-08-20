import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import './QrScanner.scss';

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  isProcessing: boolean;
}

export function QrScanner({ onScan, isProcessing }: QrScannerProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Define o ID do container para a biblioteca html5-qrcode
  const qrcodeRegionId = "html5qr-code-full-region";

  useEffect(() => {
    // Cleanup ao desmontar o componente
    return () => {
      stopScanner();
    };
  }, []);

  async function startScanner() {
    setCameraError('');
    try {
      // Cria a instância forçando a leitura apenas de QR Codes (mais performance)
      scannerRef.current = new Html5Qrcode(qrcodeRegionId, {
        verbose: false,
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
      });
      
      setIsCameraOpen(true);

      await scannerRef.current.start(
        { facingMode: "environment" }, // Prioriza a câmera traseira no mobile
        {
          fps: 10, 
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Bloqueia novas leituras se o componente pai já estiver processando
          if (!isProcessing) {
            onScan(decodedText);
          }
        },
        () => {
          // Erros contínuos de leitura (como ausência de QR na tela) são normais, ignoramos
        }
      );
    } catch (err: any) {
      setIsCameraOpen(false);
      setCameraError('Não foi possível iniciar a câmera. Verifique as permissões do navegador.');
      console.error("Erro ao iniciar scanner:", err);
    }
  }

  async function stopScanner() {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Erro ao parar scanner:", err);
      }
    }
    setIsCameraOpen(false);
  }

  return (
    <div className="qr-scanner">
      {cameraError && (
        <div className="qr-scanner__error">
          <p>{cameraError}</p>
        </div>
      )}

      {!isCameraOpen ? (
        <button 
          type="button" 
          className="btn-primary qr-scanner__start-btn" 
          onClick={startScanner}
          disabled={isProcessing}
        >
          📷 Iniciar câmera
        </button>
      ) : (
        <div className="qr-scanner__viewfinder">
          {/* Container exigido pela biblioteca */}
          <div id={qrcodeRegionId} className="qr-scanner__region"></div>
          
          <button 
            type="button" 
            className="btn-danger qr-scanner__stop-btn" 
            onClick={stopScanner}
          >
            Parar câmera
          </button>
        </div>
      )}
    </div>
  );
}
