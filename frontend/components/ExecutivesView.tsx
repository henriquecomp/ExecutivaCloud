import React, { useState, useEffect } from 'react';
import { executiveService } from '../services/executiveService';
import { organizationService } from '../services/organizationService';
import { departmentService } from '../services/departmentService';
import { Executive, Organization, Department } from '../types';
import { Search } from 'lucide-react';
import Pagination from './Pagination';

/** Listagem somente leitura. Novos executivos são criados em Usuários (convite). */
const ExecutivesView: React.FC = () => {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
  }, [filteredExecutives.length, currentPage]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Executivos</h2>
          <p className="text-gray-500 text-sm mt-1">
            Listagem somente leitura. Novos acessos são criados em Usuários (convite).
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm font-semibold">
              <tr>
                <th className="p-4 border-b">Nome</th>
                <th className="p-4 border-b">Cargo / Depto</th>
                <th className="p-4 border-b">Email Corporativo</th>
                <th className="p-4 border-b">Celular</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : filteredExecutives.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Nenhum executivo encontrado.
                  </td>
                </tr>
              ) : (
                paginatedExecutives.map((ex) => (
                  <tr key={ex.id} className="hover:bg-gray-50 border-b last:border-0">
                    <td className="p-4 font-medium">{ex.fullName}</td>
                    <td className="p-4">
                      <div className="font-medium">{ex.jobTitle || '-'}</div>
                      <div className="text-xs text-gray-500">
                        {departments.find((d) => d.id === ex.departmentId)?.name || ''}
                        {ex.departmentId && ex.organizationId ? ' - ' : ''}
                        {organizations.find((o) => o.id === ex.organizationId)?.name || ''}
                      </div>
                    </td>
                    <td className="p-4">{ex.workEmail}</td>
                    <td className="p-4">{ex.workPhone || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredExecutives.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default ExecutivesView;
