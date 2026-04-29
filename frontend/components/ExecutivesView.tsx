import React, { useState, useEffect } from 'react';
import { executiveService } from '../services/executiveService';
import { organizationService } from '../services/organizationService';
import { departmentService } from '../services/departmentService';
import { Executive, Organization, Department, LayoutView } from '../types';
import Pagination from './Pagination';
import { PrinterIcon } from './Icons';
import { downloadCsv, todayStamp } from '../utils/csvDownload';
import AppButton from './ui/AppButton';
import AppSearchInput from './ui/AppSearchInput';
import AppSelect from './ui/AppSelect';
import ToolbarPanel from './ui/ToolbarPanel';
import { DataTable, DataTableBody, DataTableEmptyRow, DataTableHead, DataTableRow, DataTableTd, DataTableTh } from './ui/DataTable';

interface ExecutivesViewProps { layout: LayoutView; }

/** Listagem somente leitura. Novos executivos são criados em Usuários (convite). */
const ExecutivesView: React.FC<ExecutivesViewProps> = ({ layout }) => {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [execData, orgData, deptData] = await Promise.all([
          executiveService.getAll(0, 1000),
          organizationService.getAll(),
          departmentService.getAll(),
        ]);
        setExecutives(execData);
        setOrganizations(orgData);
        setDepartments(deptData);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredExecutives = executives.filter((ex) => {
    const name = ex.fullName ? ex.fullName.toLowerCase() : '';
    const email = ex.workEmail ? ex.workEmail.toLowerCase() : '';
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  const paginatedExecutives = filteredExecutives.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredExecutives.length / itemsPerPage));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredExecutives.length, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, searchTerm]);

  const getDeptOrg = (ex: Executive) => {
    const dept = departments.find((d) => d.id === ex.departmentId)?.name || '';
    const org = organizations.find((o) => o.id === ex.organizationId)?.name || '';
    return [dept, org].filter(Boolean).join(' - ');
  };

  const handleExportCsv = () => {
    const rows = filteredExecutives.map((ex) => ({
      Nome: ex.fullName,
      Cargo: ex.jobTitle ?? '',
      'Depto / Empresa': getDeptOrg(ex),
      'Email Corporativo': ex.workEmail ?? '',
      Celular: ex.workPhone ?? '',
    }));
    downloadCsv(['Nome', 'Cargo', 'Depto / Empresa', 'Email Corporativo', 'Celular'], rows, `executivos_${todayStamp()}.csv`);
  };

  const renderTableView = () => (
    <DataTable>
      <DataTableHead>
        <tr>
          <DataTableTh>Nome</DataTableTh>
          <DataTableTh>Cargo / Depto</DataTableTh>
          <DataTableTh>Email Corporativo</DataTableTh>
          <DataTableTh>Celular</DataTableTh>
        </tr>
      </DataTableHead>
      <DataTableBody>
        {loading ? (
          <DataTableEmptyRow colSpan={4}>Carregando...</DataTableEmptyRow>
        ) : filteredExecutives.length === 0 ? (
          <DataTableEmptyRow colSpan={4}>Nenhum executivo encontrado.</DataTableEmptyRow>
        ) : (
          paginatedExecutives.map((ex) => (
            <DataTableRow key={ex.id}>
              <DataTableTd className="font-medium text-slate-800">{ex.fullName}</DataTableTd>
              <DataTableTd>
                <div className="font-medium">{ex.jobTitle || '-'}</div>
                <div className="text-xs text-slate-500">{getDeptOrg(ex)}</div>
              </DataTableTd>
              <DataTableTd>{ex.workEmail}</DataTableTd>
              <DataTableTd>{ex.workPhone || '-'}</DataTableTd>
            </DataTableRow>
          ))
        )}
      </DataTableBody>
    </DataTable>
  );

  const renderCardView = () => (
    loading ? (
      <div className="text-center p-6 bg-white rounded-xl shadow-md"><p className="text-slate-500">Carregando...</p></div>
    ) : filteredExecutives.length === 0 ? (
      <div className="text-center p-6 bg-white rounded-xl shadow-md"><p className="text-slate-500">Nenhum executivo encontrado.</p></div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedExecutives.map((ex) => (
          <div key={ex.id} className="bg-white rounded-xl shadow-md p-4 space-y-1">
            <h3 className="font-semibold text-slate-800 truncate">{ex.fullName}</h3>
            <p className="text-sm text-slate-600">{ex.jobTitle || '-'}</p>
            <p className="text-xs text-slate-500">{getDeptOrg(ex)}</p>
            {ex.workEmail && <p className="text-sm text-slate-600 truncate">{ex.workEmail}</p>}
            {ex.workPhone && <p className="text-sm text-slate-500">{ex.workPhone}</p>}
          </div>
        ))}
      </div>
    )
  );

  const renderListView = () => (
    loading ? (
      <div className="text-center p-6 bg-white rounded-xl shadow-md"><p className="text-slate-500">Carregando...</p></div>
    ) : filteredExecutives.length === 0 ? (
      <div className="text-center p-6 bg-white rounded-xl shadow-md"><p className="text-slate-500">Nenhum executivo encontrado.</p></div>
    ) : (
      <div className="bg-white rounded-xl shadow-md divide-y divide-slate-200">
        {paginatedExecutives.map((ex) => (
          <div key={ex.id} className="flex items-center gap-4 p-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 truncate">{ex.fullName}</h3>
              <p className="text-sm text-slate-500">{ex.jobTitle || '-'} — {getDeptOrg(ex)}</p>
            </div>
            <div className="text-sm text-slate-600 text-right shrink-0 hidden sm:block">
              <p>{ex.workEmail}</p>
              <p className="text-slate-500">{ex.workPhone || '-'}</p>
            </div>
          </div>
        ))}
      </div>
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <AppSelect
          id="limit-exec"
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="w-auto min-w-[5rem]"
          aria-label="Itens por página"
        >
          <option value={10}>10</option>
          <option value={30}>30</option>
          <option value={50}>50</option>
        </AppSelect>
        <AppButton type="button" variant="ghost" className="!p-2" title="Exportar resultados para CSV" aria-label="Exportar resultados para CSV" onClick={handleExportCsv}>
          <PrinterIcon />
        </AppButton>
      </div>
      <ToolbarPanel>
        <AppSearchInput
          type="text"
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </ToolbarPanel>

      {layout === 'table' && renderTableView()}
      {layout === 'card' && renderCardView()}
      {layout === 'list' && renderListView()}

      {!loading && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredExecutives.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default ExecutivesView;
