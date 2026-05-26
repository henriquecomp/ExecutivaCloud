import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useCepAutoLookup } from '../hooks/useCepAutoLookup';
import ConfirmationModal from './ConfirmationModal';
import {
  LegalOrganization,
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
  User,
} from '../types';
import { validateCNPJ, validateCEP, maskCNPJ, maskCEP } from '../utils/brValidators';
import { FREE_TEXT_MAX, CNPJ_MASK_MAX, CEP_MASK_MAX, UF_MAX } from '../utils/fieldLimits';
import { buildOrgAddressPayload } from '../utils/addressPayload';
import { isCompanyAdmin, isLegalOrgAdmin } from '../utils/tenantScope';

export interface OrganizationCompanyFormProps {
  organization: Partial<Organization>;
  onSave: (organization: OrganizationCreate | OrganizationUpdate) => void;
  onCancel: () => void;
  legalOrganizations: LegalOrganization[];
  currentUser: User;
  submitLabel?: string;
}

const OrganizationCompanyForm: React.FC<OrganizationCompanyFormProps> = ({
  organization,
  onSave,
  onCancel,
  legalOrganizations,
  currentUser,
  submitLabel = 'Salvar Empresa',
}) => {
  const [name, setName] = useState(organization.name || '');
  const [cnpj, setCnpj] = useState(organization.cnpj || '');
  const [street, setStreet] = useState(organization.street || '');
  const [number, setNumber] = useState(organization.number || '');
  const [neighborhood, setNeighborhood] = useState(organization.neighborhood || '');
  const [city, setCity] = useState(organization.city || '');
  const [state, setState] = useState(organization.state || '');
  const [zipCode, setZipCode] = useState(organization.zipCode || '');
  const [complement, setComplement] = useState(organization.complement || '');

  const [cnpjError, setCnpjError] = useState('');
  const cnpjInputRef = useRef<HTMLInputElement>(null);
  const cepInputRef = useRef<HTMLInputElement>(null);

  const applyCepAddress = useCallback((addr: { street: string; neighborhood: string; city: string; state: string }) => {
    setStreet(addr.street);
    setNeighborhood(addr.neighborhood);
    setCity(addr.city);
    setState(addr.state);
  }, []);

  const clearCepAddress = useCallback(() => {
    setStreet('');
    setNeighborhood('');
    setCity('');
    setState('');
  }, []);

  const { handleCepInputChange, isCepLoading, cepError, setCepError } = useCepAutoLookup({
    onAddress: applyCepAddress,
    onClearAddress: clearCepAddress,
  });

  const [isCopyDataConfirmOpen, setCopyDataConfirmOpen] = useState(false);
  const [dataToCopy, setDataToCopy] = useState<Partial<LegalOrganization> | null>(null);
  const copyConfirmedRef = useRef(false);

  const isAdminForLegalOrg = isLegalOrgAdmin(currentUser);
  const isOrgAdmin = isCompanyAdmin(currentUser);

  const [legalOrganizationId, setLegalOrganizationId] = useState(
    isAdminForLegalOrg ? currentUser.legalOrganizationId || '' : organization.legalOrganizationId || '',
  );

  const visibleLegalOrgs = useMemo(() => {
    if (isAdminForLegalOrg) {
      return legalOrganizations.filter((lo) => String(lo.id) === String(currentUser.legalOrganizationId));
    }
    return legalOrganizations;
  }, [legalOrganizations, currentUser, isAdminForLegalOrg]);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (cnpjError) setCnpjError('');
    setCnpj(maskCNPJ(e.target.value));
  };

  const handleCnpjBlur = () => {
    if (!cnpj.trim()) {
      setCnpjError('CNPJ é obrigatório.');
    } else if (!validateCNPJ(cnpj)) {
      setCnpjError('CNPJ inválido. Verifique o número e tente novamente.');
    } else {
      setCnpjError('');
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleCepInputChange(e.target.value, setZipCode);
  };

  const handleCepBlur = () => {
    const digits = zipCode.replace(/\D/g, '');
    if (digits.length > 0 && digits.length !== 8) {
      setCepError('CEP incompleto ou inválido.');
    }
  };

  const handleCompanyNameBlur = () => {
    if (!name || !legalOrganizationId || cnpj || zipCode) {
      return;
    }

    const selectedLegalOrg = legalOrganizations.find((lo) => String(lo.id) === String(legalOrganizationId));
    if (selectedLegalOrg && (selectedLegalOrg.cnpj || selectedLegalOrg.zipCode || selectedLegalOrg.street)) {
      copyConfirmedRef.current = false;
      setDataToCopy(selectedLegalOrg);
      setCopyDataConfirmOpen(true);
    }
  };

  const handleConfirmCopyData = () => {
    if (dataToCopy) {
      setCnpj(maskCNPJ(dataToCopy.cnpj || ''));
      setZipCode(maskCEP(dataToCopy.zipCode || ''));
      setStreet(dataToCopy.street || '');
      setNumber(dataToCopy.number || '');
      setNeighborhood(dataToCopy.neighborhood || '');
      setCity(dataToCopy.city || '');
      setState(dataToCopy.state || '');
      setComplement(dataToCopy.complement || '');
      setCnpjError('');
      setCepError('');
    }
    copyConfirmedRef.current = true;
  };

  const handleCloseCopyModal = () => {
    setCopyDataConfirmOpen(false);
    if (!copyConfirmedRef.current) {
      cnpjInputRef.current?.focus();
    }
    setDataToCopy(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !legalOrganizationId) return;
    if (!cnpj.trim() || !validateCNPJ(cnpj)) {
      handleCnpjBlur();
      cnpjInputRef.current?.focus();
      return;
    }
    if (!validateCEP(zipCode)) {
      setCepError('CEP é obrigatório e deve ter 8 dígitos.');
      cepInputRef.current?.focus();
      return;
    }
    if (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !state.trim()) {
      return;
    }

    const address = buildOrgAddressPayload({
      cnpj,
      street,
      number,
      neighborhood,
      city,
      state,
      zipCode,
      complement,
    });

    const data: OrganizationCreate | OrganizationUpdate = {
      name,
      legalOrganizationId: Number(legalOrganizationId),
      ...address,
    };
    if (organization.id) {
      (data as OrganizationUpdate & { id?: string }).id = organization.id;
    }

    onSave(data);
  };

  return (
    <>
      {isCepLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-700 font-semibold">Buscando CEP...</p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="legalOrganizationId" className="block text-sm font-medium text-slate-700">
            Organização Matriz
          </label>
          <select
            id="legalOrganizationId"
            value={legalOrganizationId}
            onChange={(e) => setLegalOrganizationId(e.target.value)}
            required
            disabled={isAdminForLegalOrg || isOrgAdmin}
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option value="" disabled>
              Selecione uma organização
            </option>
            {visibleLegalOrgs.map((lo) => (
              <option key={lo.id} value={lo.id}>
                {lo.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Nome da Empresa
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleCompanyNameBlur}
            required
            maxLength={FREE_TEXT_MAX}
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium text-slate-700">
              CNPJ *
            </label>
            <input
              ref={cnpjInputRef}
              type="text"
              id="cnpj"
              value={cnpj}
              required
              maxLength={CNPJ_MASK_MAX}
              onChange={handleCnpjChange}
              onBlur={handleCnpjBlur}
              className={`mt-1 block w-full px-3 py-2 bg-white border ${cnpjError ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {cnpjError && <p className="mt-1 text-xs text-red-600">{cnpjError}</p>}
          </div>
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-slate-700">
              CEP *
            </label>
            <input
              ref={cepInputRef}
              type="text"
              id="zipCode"
              value={zipCode}
              required
              maxLength={CEP_MASK_MAX}
              onChange={handleCepChange}
              onBlur={handleCepBlur}
              className={`mt-1 block w-full px-3 py-2 bg-white border ${cepError ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {cepError && <p className="mt-1 text-xs text-red-600">{cepError}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="street" className="block text-sm font-medium text-slate-700">
            Rua *
          </label>
          <input
            type="text"
            id="street"
            value={street}
            required
            maxLength={FREE_TEXT_MAX}
            onChange={(e) => setStreet(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="number" className="block text-sm font-medium text-slate-700">
              Número *
            </label>
            <input
              type="text"
              id="number"
              value={number}
              required
              maxLength={FREE_TEXT_MAX}
              onChange={(e) => setNumber(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="complement" className="block text-sm font-medium text-slate-700">
              Complemento
            </label>
            <input
              type="text"
              id="complement"
              value={complement}
              maxLength={FREE_TEXT_MAX}
              onChange={(e) => setComplement(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="neighborhood" className="block text-sm font-medium text-slate-700">
              Bairro *
            </label>
            <input
              type="text"
              id="neighborhood"
              value={neighborhood}
              required
              maxLength={FREE_TEXT_MAX}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="md:col-span-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="city" className="block text-sm font-medium text-slate-700">
              Cidade *
            </label>
            <input
              type="text"
              id="city"
              value={city}
              required
              maxLength={FREE_TEXT_MAX}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="state" className="block text-sm font-medium text-slate-700">
              Estado (UF) *
            </label>
            <input
              type="text"
              id="state"
              value={state}
              required
              maxLength={UF_MAX}
              onChange={(e) => setState(e.target.value.toUpperCase())}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm uppercase"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition"
          >
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
            {submitLabel}
          </button>
        </div>
      </form>
      <ConfirmationModal
        isOpen={isCopyDataConfirmOpen}
        onClose={handleCloseCopyModal}
        onConfirm={handleConfirmCopyData}
        title="Usar Dados da Organização"
        message="A organização matriz selecionada possui dados de endereço e CNPJ. Deseja usar os mesmos dados para esta empresa?"
      />
    </>
  );
};

export default OrganizationCompanyForm;
