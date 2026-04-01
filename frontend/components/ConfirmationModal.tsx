import React, { useState } from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  /** Conteúdo extra entre a mensagem e os botões (ex.: lista de vínculos que impedem exclusão). */
  secondaryContent?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  secondaryContent,
}) => {
  const [pending, setPending] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose}>
      <div className="space-y-6">
        <p className="text-slate-600 whitespace-pre-line">{message}</p>
        {secondaryContent}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={pending}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
          >
            {pending ? 'Aguarde…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;