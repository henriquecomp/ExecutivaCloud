import axios from 'axios';

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

export function isWeb3FormsConfigured(): boolean {
  const key = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

export interface SubmitLoginContactParams {
  fromEmail: string;
  fromName: string;
  message: string;
}

/**
 * Envia mensagem pela API do Web3Forms (e-mail recebido na caixa cadastrada na chave).
 * Requer VITE_WEB3FORMS_ACCESS_KEY no .env do frontend.
 */
export async function submitLoginContactForm(params: SubmitLoginContactParams): Promise<void> {
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  if (!accessKey || !String(accessKey).trim()) {
    throw new Error(
      'Chave Web3Forms não configurada. Adicione VITE_WEB3FORMS_ACCESS_KEY ao arquivo .env do frontend.',
    );
  }

  const { data } = await axios.post<{ success: boolean; message?: string }>(
    WEB3FORMS_URL,
    {
      access_key: accessKey.trim(),
      subject: '[Executiva Cloud] Contato pela tela de login',
      name: params.fromName.trim() || params.fromEmail.trim(),
      email: params.fromEmail.trim(),
      message: params.message.trim(),
    },
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (!data.success) {
    throw new Error(data.message || 'Não foi possível enviar a mensagem.');
  }
}
