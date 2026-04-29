import React, { useState, useEffect, useMemo } from 'react';
import { AllDataBackup } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { DownloadIcon, UploadIcon, CheckCircleIcon, ExclamationTriangleIcon } from './Icons';
import { settingsBackupService, SettingsBackup } from '../services/settingsBackupService';
import AppLabel from './ui/AppLabel';
import AppSelect from './ui/AppSelect';
import ToolbarPanel from './ui/ToolbarPanel';
import Pagination from './Pagination';

// --- Main Settings View ---
interface SettingsViewProps {
  allData: Omit<AllDataBackup, 'version'>;
  setAllData: { [K in keyof Omit<AllDataBackup, 'version'> as `set${Capitalize<K>}`]: React.Dispatch<React.SetStateAction<AllDataBackup[K]>> };
  /** Após restaurar no servidor, recarrega dados da API. */
  onAfterRestore?: () => Promise<void>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ allData, setAllData, onAfterRestore }) => {
    const appVersion = '1.3.0'; // Should match the one in Sidebar.tsx
    
    const [fileToImport, setFileToImport] = useState<File | null>(null);
    const [isImportConfirmOpen, setImportConfirmOpen] = useState(false);
    const [dataToImport, setDataToImport] = useState<AllDataBackup | null>(null);
    const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [savedBackups, setSavedBackups] = useState<SettingsBackup[]>([]);
    const [isLoadingBackups, setIsLoadingBackups] = useState(false);
    const [backupToRestore, setBackupToRestore] = useState<SettingsBackup | null>(null);
    const [backupToDelete, setBackupToDelete] = useState<SettingsBackup | null>(null);
    const [backupPage, setBackupPage] = useState(1);
    const [backupLimit, setBackupLimit] = useState(8);

    const paginatedBackups = useMemo(() => {
        const start = (backupPage - 1) * backupLimit;
        return savedBackups.slice(start, start + backupLimit);
    }, [savedBackups, backupPage, backupLimit]);

    useEffect(() => {
        setBackupPage(1);
    }, [savedBackups, backupLimit]);
    
    useEffect(() => {
        if (importMessage) {
            const timer = setTimeout(() => setImportMessage(null), 5000); // Hide message after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [importMessage]);


    // Data Management Handlers
    const requiredKeys: (keyof AllDataBackup)[] = [
        'legalOrganizations',
        'organizations',
        'departments',
        'executives',
        'secretaries',
        'users',
        'events',
        'tasks',
        'contacts',
        'expenses',
        'expenseCategories',
        'eventTypes',
        'contactTypes',
        'documents',
        'documentCategories',
    ];

    const isValidBackup = (parsedData: AllDataBackup) => {
        if (parsedData.version !== appVersion) {
            return false;
        }
        return requiredKeys.every(key => Array.isArray(parsedData[key]));
    };

    const applyBackupData = (backupData: Omit<AllDataBackup, 'version'>) => {
        setAllData.setLegalOrganizations(backupData.legalOrganizations);
        setAllData.setOrganizations(backupData.organizations);
        setAllData.setDepartments(backupData.departments);
        setAllData.setExecutives(backupData.executives);
        setAllData.setSecretaries(backupData.secretaries);
        setAllData.setEventTypes(backupData.eventTypes);
        setAllData.setEvents(backupData.events);
        setAllData.setContactTypes(backupData.contactTypes);
        setAllData.setContacts(backupData.contacts);
        setAllData.setExpenses(backupData.expenses);
        setAllData.setExpenseCategories(backupData.expenseCategories);
        setAllData.setTasks(backupData.tasks);
        setAllData.setDocumentCategories(backupData.documentCategories);
        setAllData.setDocuments(backupData.documents);
    };

    const loadSavedBackups = async () => {
        try {
            setIsLoadingBackups(true);
            const backups = await settingsBackupService.getAll();
            setSavedBackups(backups);
        } catch (error) {
            console.error('Erro ao carregar backups salvos:', error);
        } finally {
            setIsLoadingBackups(false);
        }
    };

    useEffect(() => {
        loadSavedBackups();
    }, []);

    const saveSnapshotToServer = async (name?: string) => {
        const backupName = name || `Backup ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        await settingsBackupService.create({
            name: backupName,
            version: appVersion,
            data: allData,
        });
        await loadSavedBackups();
    };

    const handleExportData = () => {
        const dataToExport: AllDataBackup = { version: appVersion, ...allData };
        const jsonData = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `executiva_cloud_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSaveBackup = async () => {
        setImportMessage(null);
        try {
            await saveSnapshotToServer();
            setImportMessage({ type: 'success', text: 'Backup salvo no servidor com sucesso!' });
        } catch (error) {
            console.error('Erro ao salvar backup:', error);
            setImportMessage({ type: 'error', text: 'Não foi possível salvar o backup no servidor.' });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImportMessage(null);
        if (e.target.files && e.target.files.length > 0) {
            setFileToImport(e.target.files[0]);
        }
    };

    const handleImportClick = () => {
        if (!fileToImport) return;
        setImportMessage(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not a string.");
                const parsedData = JSON.parse(text) as AllDataBackup;
                
                if (!isValidBackup(parsedData)) {
                    throw new Error("O arquivo de backup é inválido ou está corrompido.");
                }

                setDataToImport(parsedData);
                setImportConfirmOpen(true);
            } catch (error) {
                setImportMessage({ type: 'error', text: 'O arquivo de backup é imcompatível com a versão atual ou está corrompido.' });
                setDataToImport(null);
            }
        };
        reader.onerror = () => {
             setImportMessage({ type: 'error', text: 'Erro ao tentar ler o arquivo selecionado.' });
        }
        reader.readAsText(fileToImport);
    };

    const confirmImport = async () => {
        if (!dataToImport) return;
        setImportMessage(null);
        try {
            const { version: _v, ...rest } = dataToImport;
            await settingsBackupService.restore(rest);
            applyBackupData(rest);
            await onAfterRestore?.();
            setImportConfirmOpen(false);
            setDataToImport(null);
            setFileToImport(null);
            setImportMessage({ type: 'success', text: 'Dados importados e gravados no servidor com sucesso!' });
        } catch (error) {
            console.error('Erro ao importar/restaurar no servidor:', error);
            setImportMessage({ type: 'error', text: 'Não foi possível gravar o backup no banco de dados.' });
            throw error;
        }
    };

    const confirmRestoreFromServer = async () => {
        if (!backupToRestore) return;
        const backupData = { version: backupToRestore.version, ...backupToRestore.data } as AllDataBackup;
        if (!isValidBackup(backupData)) {
            setImportMessage({ type: 'error', text: 'O backup salvo está incompatível com a versão atual.' });
            setBackupToRestore(null);
            return;
        }
        setImportMessage(null);
        try {
            await settingsBackupService.restore(backupToRestore.data);
            applyBackupData(backupToRestore.data);
            await onAfterRestore?.();
            setBackupToRestore(null);
            setImportMessage({ type: 'success', text: 'Backup restaurado no banco de dados com sucesso!' });
        } catch (error) {
            console.error('Erro ao restaurar backup no servidor:', error);
            setImportMessage({ type: 'error', text: 'Não foi possível restaurar o backup no banco de dados.' });
            throw error;
        }
    };

    const confirmDeleteServerBackup = async () => {
        if (!backupToDelete) return;
        try {
            await settingsBackupService.delete(backupToDelete.id);
            await loadSavedBackups();
            setBackupToDelete(null);
            setImportMessage({ type: 'success', text: 'Backup excluído com sucesso.' });
        } catch (error) {
            console.error('Erro ao excluir backup salvo:', error);
            setImportMessage({ type: 'error', text: 'Não foi possível excluir o backup salvo.' });
        }
    };


    return (
        <div className="space-y-8 animate-fade-in">
            {/* Data Management Panel */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-slate-700 mb-4 border-b border-slate-200 pb-3">Gerenciamento de Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Export Section */}
                    <div>
                        <h4 className="font-semibold text-slate-800">Exportar Dados</h4>
                        <p className="text-sm text-slate-500 mt-1 mb-4">Salve todos os dados da aplicação em um único arquivo de backup. Guarde este arquivo em um local seguro.</p>
                        <button onClick={handleExportData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition">
                            <DownloadIcon />
                            Exportar Dados
                        </button>
                        <button onClick={handleSaveBackup} className="mt-3 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition">
                            <UploadIcon />
                            Salvar Backup no Servidor
                        </button>
                    </div>
                    {/* Import Section */}
                    <div>
                        <h4 className="font-semibold text-slate-800">Importar Dados</h4>
                        <p className="text-sm text-slate-500 mt-1 mb-4">Importe dados de um arquivo de backup. <strong className="text-red-600">Atenção:</strong> Isso substituirá todos os dados atuais.</p>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                            />
                             <button onClick={handleImportClick} disabled={!fileToImport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed flex-shrink-0">
                                <UploadIcon />
                                Importar
                            </button>
                        </div>
                        {importMessage && (
                            <div className={`mt-4 p-3 rounded-md flex items-center gap-3 text-sm animate-fade-in-fast ${importMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {importMessage.type === 'success' ? <CheckCircleIcon className="w-6 h-6" /> : <ExclamationTriangleIcon className="w-6 h-6" />}
                                <span>{importMessage.text}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-200 pb-3">
                    <h3 className="text-xl font-bold text-slate-700">Backups Salvos no Servidor</h3>
                    {isLoadingBackups && <span className="text-sm text-slate-500">Carregando...</span>}
                </div>
                {savedBackups.length > 0 && (
                    <ToolbarPanel className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <div className="flex items-center gap-2">
                            <AppLabel htmlFor="limit-backups" className="mb-0 inline text-slate-600">
                                Itens por página
                            </AppLabel>
                            <AppSelect id="limit-backups" value={backupLimit} onChange={(e) => setBackupLimit(Number(e.target.value))} className="w-auto min-w-[5rem]">
                                <option value={4}>4</option>
                                <option value={8}>8</option>
                                <option value={16}>16</option>
                            </AppSelect>
                        </div>
                    </ToolbarPanel>
                )}
                <div className="space-y-2">
                    {paginatedBackups.map((backup) => (
                        <div key={backup.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-800">{backup.name}</p>
                                <p className="text-xs text-slate-500">
                                    Versão {backup.version} - {new Date(backup.createdAt).toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setBackupToRestore(backup)} className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition">
                                    Restaurar
                                </button>
                                <button onClick={() => setBackupToDelete(backup)} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition">
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))}
                    {savedBackups.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-4">Nenhum backup salvo no servidor.</p>
                    )}
                </div>
                {savedBackups.length > 0 && (
                    <Pagination
                        currentPage={backupPage}
                        totalItems={savedBackups.length}
                        itemsPerPage={backupLimit}
                        onPageChange={setBackupPage}
                    />
                )}
            </div>

            {isImportConfirmOpen && (
                 <ConfirmationModal
                    isOpen={isImportConfirmOpen}
                    onClose={() => setImportConfirmOpen(false)}
                    onConfirm={confirmImport}
                    title="Confirmar Importação de Dados"
                    message="Tem certeza que deseja importar este arquivo? Todos os dados atuais na aplicação serão substituídos permanentemente. Esta ação não pode ser desfeita."
                />
            )}

            {backupToRestore && (
                <ConfirmationModal
                    isOpen={!!backupToRestore}
                    onClose={() => setBackupToRestore(null)}
                    onConfirm={confirmRestoreFromServer}
                    title="Confirmar Restauração de Backup"
                    message={`Deseja restaurar o backup "${backupToRestore.name}"? Os dados atuais da aplicação serão substituídos.`}
                />
            )}

            {backupToDelete && (
                <ConfirmationModal
                    isOpen={!!backupToDelete}
                    onClose={() => setBackupToDelete(null)}
                    onConfirm={confirmDeleteServerBackup}
                    title="Confirmar Exclusão de Backup"
                    message={`Deseja excluir o backup "${backupToDelete.name}" do servidor?`}
                />
            )}
        </div>
    );
};

export default SettingsView;