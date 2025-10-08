import React, { useState } from 'react';
import { Executive, Event, Expense, Task, Contact } from '../types';

interface ReportsViewProps {
  executives: Executive[];
  events: Event[];
  expenses: Expense[];
  tasks: Task[];
  contacts: Contact[];
}

type ReportData = {
    'Tipo': string;
    'Executivo': string;
    'Data': string;
    'Descrição/Título': string;
    'Detalhe 1'?: string | number;
    'Detalhe 2'?: string | number;
    'Detalhe 3'?: string | number;
};

// Internal type to hold a sortable date
type ReportDataInternal = ReportData & { sortDate: Date };

const ReportsView: React.FC<ReportsViewProps> = ({ executives, events, expenses, tasks, contacts }) => {
    const [selectedExecIds, setSelectedExecIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dataTypes, setDataTypes] = useState({ events: true, expenses: true, tasks: true, contacts: true });
    
    const [fullReport, setFullReport] = useState<ReportData[]>([]);
    const [displayReport, setDisplayReport] = useState<ReportData[]>([]);
    const [reportGenerated, setReportGenerated] = useState(false);

    const dataTypeLabels: { [key: string]: string } = {
        events: 'Eventos',
        expenses: 'Finanças',
        tasks: 'Tarefas',
        contacts: 'Contatos',
    };

    const handleExecToggle = (execId: string) => {
        setSelectedExecIds(prev =>
            prev.includes(execId)
                ? prev.filter(id => id !== execId)
                : [...prev, execId]
        );
    };

    const handleDataTypeChange = (type: keyof typeof dataTypes) => {
        setDataTypes(prev => ({...prev, [type]: !prev[type] }));
    };

    const handleGenerateReport = () => {
        const execsToReport = selectedExecIds.length > 0 
            ? executives.filter(e => selectedExecIds.includes(e.id)) 
            : executives;
        
        const execIdsToReport = execsToReport.map(e => e.id);

        const sDate = startDate ? new Date(startDate + 'T00:00:00') : null;
        const eDate = endDate ? new Date(endDate + 'T23:59:59') : null;

        let generatedData: ReportDataInternal[] = [];

        // Process Events
        if (dataTypes.events) {
            events
                .filter(e => execIdsToReport.includes(e.executiveId))
                .filter(e => {
                    const eventDate = new Date(e.startTime);
                    if (sDate && eventDate < sDate) return false;
                    if (eDate && eventDate > eDate) return false;
                    return true;
                })
                .forEach(e => {
                    const exec = executives.find(ex => ex.id === e.executiveId);
                    generatedData.push({
                        'Tipo': 'Evento',
                        'Executivo': exec?.fullName || 'N/A',
                        'Data': new Date(e.startTime).toLocaleString('pt-BR'),
                        'Descrição/Título': e.title,
                        'Detalhe 1': `Local: ${e.location || 'N/A'}`,
                        'Detalhe 2': `Duração: ${((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000)} min`,
                        sortDate: new Date(e.startTime)
                    });
                });
        }

        // Process Expenses
        if (dataTypes.expenses) {
            expenses
                .filter(e => execIdsToReport.includes(e.executiveId))
                .filter(e => {
                    const expenseDate = new Date(e.expenseDate + 'T00:00:00');
                    if (sDate && expenseDate < sDate) return false;
                    if (eDate && expenseDate > eDate) return false;
                    return true;
                })
                .forEach(e => {
                    const exec = executives.find(ex => ex.id === e.executiveId);
                    generatedData.push({
                        'Tipo': `Financeiro (${e.type})`,
                        'Executivo': exec?.fullName || 'N/A',
                        'Data': new Date(e.expenseDate + 'T00:00:00').toLocaleDateString('pt-BR'),
                        'Descrição/Título': e.description,
                        'Detalhe 1': `Valor: ${e.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`,
                        'Detalhe 2': `Status: ${e.status}`,
                        'Detalhe 3': `Entidade: ${e.entityType}`,
                        sortDate: new Date(e.expenseDate + 'T00:00:00')
                    });
                });
        }
        
        // Process Tasks
        if (dataTypes.tasks) {
            tasks
                .filter(t => execIdsToReport.includes(t.executiveId))
                .filter(t => {
                    const taskDate = new Date(t.dueDate + 'T00:00:00');
                    if (sDate && taskDate < sDate) return false;
                    if (eDate && taskDate > eDate) return false;
                    return true;
                })
                .forEach(t => {
                    const exec = executives.find(ex => ex.id === t.executiveId);
                    generatedData.push({
                        'Tipo': 'Tarefa',
                        'Executivo': exec?.fullName || 'N/A',
                        'Data': new Date(t.dueDate + 'T00:00:00').toLocaleDateString('pt-BR'),
                        'Descrição/Título': t.title,
                        'Detalhe 1': `Prioridade: ${t.priority}`,
                        'Detalhe 2': `Status: ${t.status}`,
                        sortDate: new Date(t.dueDate + 'T00:00:00')
                    });
                });
        }

        // Process Contacts (no date filter)
        if (dataTypes.contacts) {
             contacts
                .filter(c => execIdsToReport.includes(c.executiveId))
                .forEach(c => {
                    const exec = executives.find(ex => ex.id === c.executiveId);
                    generatedData.push({
                        'Tipo': 'Contato',
                        'Executivo': exec?.fullName || 'N/A',
                        'Data': '-',
                        'Descrição/Título': c.fullName,
                        'Detalhe 1': `Empresa: ${c.company || 'N/A'}`,
                        'Detalhe 2': `E-mail: ${c.email || 'N/A'}`,
                        sortDate: new Date(0) // epoch to sort them first
                    });
                });
        }

        // Sort by the real date
        generatedData.sort((a,b) => a.sortDate.getTime() - b.sortDate.getTime());
        
        // Remove the sort key before setting state
        const finalReportData: ReportData[] = generatedData.map(({ sortDate, ...rest }) => rest);

        setFullReport(finalReportData);
        setDisplayReport(finalReportData.slice(-50));
        setReportGenerated(true);
    };
    
    const convertToCSV = (data: ReportData[]) => {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        for (const row of data) {
            const values = headers.map(header => {
                const escaped = ('' + row[header as keyof ReportData]).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }
        return csvRows.join('\n');
    };

    const handleExportCSV = () => {
        const csvData = convertToCSV(fullReport);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_executiva_cloud_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <div className="space-y-6 animate-fade-in">
            <header>
                <h2 className="text-3xl font-bold text-slate-800">Gerador de Relatórios</h2>
                <p className="text-slate-500 mt-1">Filtre e extraia os dados que você precisa.</p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Executive Filter */}
                    <div>
                        <label className="block text-base font-semibold text-slate-800 mb-2">Executivos</label>
                        <div className="p-3 border border-slate-300 rounded-md max-h-48 overflow-y-auto space-y-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="exec-all"
                                    checked={selectedExecIds.length === 0}
                                    onChange={() => setSelectedExecIds([])}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="exec-all" className="ml-3 block text-sm font-semibold text-slate-800">Todos os Executivos</label>
                            </div>
                            {executives.map(exec => (
                                <div key={exec.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`exec-${exec.id}`}
                                        checked={selectedExecIds.includes(exec.id)}
                                        onChange={() => handleExecToggle(exec.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor={`exec-${exec.id}`} className="ml-3 block text-sm text-slate-600">{exec.fullName}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Date and Data Type Filter */}
                    <div>
                         <label className="block text-base font-semibold text-slate-800 mb-2">Período</label>
                         <div className="space-y-4">
                            <div>
                                <label htmlFor="start-date" className="block text-sm font-medium text-slate-700">Data de Início</label>
                                <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="end-date" className="block text-sm font-medium text-slate-700">Data de Fim</label>
                                <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                    </div>
                    
                    <div>
                         <label className="block text-base font-semibold text-slate-800 mb-2">Tipos de Dados</label>
                         <div className="space-y-2">
                             {Object.keys(dataTypes).map(key => (
                                <div key={key} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`type-${key}`}
                                        checked={dataTypes[key as keyof typeof dataTypes]}
                                        onChange={() => handleDataTypeChange(key as keyof typeof dataTypes)}
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor={`type-${key}`} className="ml-3 block text-sm text-slate-600">{dataTypeLabels[key]}</label>
                                </div>
                             ))}
                        </div>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
                    <button onClick={handleGenerateReport} className="px-6 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition">
                        Gerar Relatório
                    </button>
                </div>
            </div>

            {reportGenerated && (
                <div className="bg-white p-4 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <div>
                            <h3 className="text-xl font-bold text-slate-700">Resultado do Relatório</h3>
                            {fullReport.length > 50 && (
                                <p className="text-sm text-slate-500 mt-1">
                                    Mostrando os últimos 50 de {fullReport.length} registros. A exportação CSV incluirá todos os dados.
                                </p>
                            )}
                        </div>
                        <button onClick={handleExportCSV} disabled={fullReport.length === 0} className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed text-sm">
                            Exportar para CSV
                        </button>
                    </div>
                     <div className="overflow-auto max-h-[500px] border border-slate-200 rounded-lg">
                        <table className="w-full text-left">
                            <thead className="border-b-2 border-slate-200 text-sm text-slate-500 sticky top-0 bg-white/95 backdrop-blur-sm">
                                <tr>
                                    {displayReport.length > 0 && Object.keys(displayReport[0]).map(header => <th key={header} className="p-3 whitespace-nowrap">{header}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {displayReport.map((row, index) => (
                                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 text-sm">
                                        {Object.values(row).map((value, i) => <td key={i} className="p-3 text-slate-700 whitespace-nowrap">{value}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {fullReport.length === 0 && <p className="text-center p-6 text-slate-500">Nenhum dado encontrado para os filtros selecionados.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsView;