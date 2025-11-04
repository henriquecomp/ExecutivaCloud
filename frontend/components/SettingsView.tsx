import React, { useState, useEffect } from 'react';
import { AllDataBackup } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { DownloadIcon, UploadIcon, CheckCircleIcon, ExclamationTriangleIcon } from './Icons';

// --- Main Settings View ---
interface SettingsViewProps {
  allData: Omit<AllDataBackup, 'version'>;
  setAllData: { [K in keyof Omit<AllDataBackup, 'version'> as `set${Capitalize<K>}`]: React.Dispatch<React.SetStateAction<AllDataBackup[K]>> };
}

const SettingsView: React.FC<SettingsViewProps> = ({ allData, setAllData }) => {
    const appVersion = '1.3.0'; // Should match the one in Sidebar.tsx
    
    const [fileToImport, setFileToImport] = useState<File | null>(null);
    const [isImportConfirmOpen, setImportConfirmOpen] = useState(false);
    const [dataToImport, setDataToImport] = useState<AllDataBackup | null>(null);
    const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    useEffect(() => {
        if (importMessage) {
            const timer = setTimeout(() => setImportMessage(null), 5000); // Hide message after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [importMessage]);


    // Data Management Handlers
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
                
                if (parsedData.version !== appVersion) {
                    throw new Error("Versão do arquivo de backup incompatível.");
                }

                const requiredKeys: (keyof AllDataBackup)[] = ['legalOrganizations', 'organizations', 'departments', 'executives', 'secretaries', 'users', 'events', 'tasks', 'contacts', 'expenses', 'expenseCategories', 'eventTypes', 'contactTypes', 'documents', 'documentCategories'];
                const hasAllKeys = requiredKeys.every(key => Array.isArray(parsedData[key]));

                if (!hasAllKeys) {
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

    const confirmImport = () => {
        if (!dataToImport) return;
        setAllData.setLegalOrganizations(dataToImport.legalOrganizations);
        setAllData.setOrganizations(dataToImport.organizations);
        setAllData.setDepartments(dataToImport.departments);
        setAllData.setExecutives(dataToImport.executives);
        setAllData.setSecretaries(dataToImport.secretaries);
        setAllData.setUsers(dataToImport.users);
        setAllData.setEventTypes(dataToImport.eventTypes);
        setAllData.setEvents(dataToImport.events);
        setAllData.setContactTypes(dataToImport.contactTypes);
        setAllData.setContacts(dataToImport.contacts);
        setAllData.setExpenses(dataToImport.expenses);
        setAllData.setExpenseCategories(dataToImport.expenseCategories);
        setAllData.setTasks(dataToImport.tasks);
        setAllData.setDocumentCategories(dataToImport.documentCategories);
        setAllData.setDocuments(dataToImport.documents);
        
        setImportConfirmOpen(false);
        setDataToImport(null);
        setFileToImport(null);
        setImportMessage({ type: 'success', text: 'Dados importados com sucesso!' });
    };


    return (
        <div className="space-y-8 animate-fade-in">
             <header>
                <h2 className="text-3xl font-bold text-slate-800">Configurações</h2>
                <p className="text-slate-500 mt-1">Gerencie os dados da sua aplicação.</p>
            </header>

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

            {isImportConfirmOpen && (
                 <ConfirmationModal
                    isOpen={isImportConfirmOpen}
                    onClose={() => setImportConfirmOpen(false)}
                    onConfirm={confirmImport}
                    title="Confirmar Importação de Dados"
                    message="Tem certeza que deseja importar este arquivo? Todos os dados atuais na aplicação serão substituídos permanentemente. Esta ação não pode ser desfeita."
                />
            )}
        </div>
    );
};

export default SettingsView;