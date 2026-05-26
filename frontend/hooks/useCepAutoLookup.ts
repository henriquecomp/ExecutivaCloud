import { useCallback, useRef, useState } from 'react';
import { maskCEP, normalizeDigits } from '../utils/brValidators';
import { CepAddressFields, fetchAddressByCep } from '../utils/cepLookup';

const CEP_ERROR_MSG = 'CEP inválido. Verifique e tente novamente.';

export interface UseCepAutoLookupOptions {
  onAddress: (fields: CepAddressFields) => void;
  /** Chamado quando a busca falha ou o CEP fica incompleto após edição. */
  onClearAddress?: () => void;
}

/**
 * Dispara busca ViaCEP assim que o usuário digitar 8 dígitos (onChange).
 */
export function useCepAutoLookup({ onAddress, onClearAddress }: UseCepAutoLookupOptions) {
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const lastFetchedDigitsRef = useRef('');
  const requestIdRef = useRef(0);

  const handleCepInputChange = useCallback(
    (rawValue: string, setZipCode: (masked: string) => void) => {
      const masked = maskCEP(rawValue);
      setZipCode(masked);
      if (cepError) setCepError('');

      const digits = normalizeDigits(masked);

      if (digits.length === 0) {
        lastFetchedDigitsRef.current = '';
        return;
      }

      if (digits.length !== 8) {
        if (digits.length < 8) {
          lastFetchedDigitsRef.current = '';
        }
        return;
      }

      if (digits === lastFetchedDigitsRef.current) {
        return;
      }

      const requestId = ++requestIdRef.current;
      lastFetchedDigitsRef.current = digits;

      void (async () => {
        setIsCepLoading(true);
        try {
          const address = await fetchAddressByCep(digits);
          if (requestId !== requestIdRef.current) return;
          onAddress(address);
          setCepError('');
        } catch {
          if (requestId !== requestIdRef.current) return;
          setCepError(CEP_ERROR_MSG);
          lastFetchedDigitsRef.current = '';
          onClearAddress?.();
        } finally {
          if (requestId === requestIdRef.current) {
            setIsCepLoading(false);
          }
        }
      })();
    },
    [cepError, onAddress, onClearAddress],
  );

  return {
    handleCepInputChange,
    isCepLoading,
    cepError,
    setCepError,
  };
}
