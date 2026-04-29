import React, { useState, useEffect } from 'react';
import { executiveService } from '../services/executiveService';
import { organizationService } from '../services/organizationService';
import { departmentService } from '../services/departmentService';
import { Executive, Organization, Department } from '../types';
import Pagination from './Pagination';
import AppSearchInput from './ui/AppSearchInput';
import AppLabel from './ui/AppLabel';
import AppSelect from './ui/AppSelect';
import ToolbarPanel from './ui/ToolbarPanel';
import { DataTable, DataTableBody, DataTableEmptyRow, DataTableHead, DataTableRow, DataTableTd, DataTableTh } from './ui/DataTable';

/** Listagem somente leitura. Novos executivos são criados em Usuários (convite). */
const ExecutivesView: React.FC = () => {
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

  return (
    <div className="space-y-6">
      <ToolbarPanel className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <AppSearchInput
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AppLabel htmlFor="limit-exec" className="mb-0 inline text-slate-600">
            Itens por página
          </AppLabel>
          <AppSelect
            id="limit-exec"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="w-auto min-w-[5rem]"
          >
            <option value={10}>10</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </AppSelect>
        </div>
      </ToolbarPanel>

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
                  <div className="text-xs text-slate-500">
                    {departments.find((d) => d.id === ex.departmentId)?.name || ''}
                    {ex.departmentId && ex.organizationId ? ' - ' : ''}
                    {organizations.find((o) => o.id === ex.organizationId)?.name || ''}
                  </div>
                </DataTableTd>
                <DataTableTd>{ex.workEmail}</DataTableTd>
                <DataTableTd>{ex.workPhone || '-'}</DataTableTd>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>
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
