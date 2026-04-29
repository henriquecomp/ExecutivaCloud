import React, { useState, useMemo, useEffect } from 'react';
import { Document, DocumentCategory } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import ImageModal from './ImageModal';
import { EditIcon, DeleteIcon, PlusIcon, CogIcon, UploadIcon } from './Icons';
import { FormDangerAlert } from './ui/FormDangerAlert';
import AppButton from './ui/AppButton';
import AppInput from './ui/AppInput';
import AppLabel from './ui/AppLabel';
import AppSelect from './ui/AppSelect';
import FormActions from './ui/FormActions';
import TypeColorFormField from './ui/TypeColorFormField';
import TypeColorSwatch from './ui/TypeColorSwatch';
import { typeMgmtDeleteIconBtn, typeMgmtEditIconBtn } from './ui/typeManagementStyles';
import ToolbarPanel from './ui/ToolbarPanel';
import Pagination from './Pagination';
import { documentCategoryService } from '../services/documentCategoryService';
import { documentService } from '../services/documentService';
import { getApiErrorMessage } from '../utils/apiError';

interface DocumentsViewProps {
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  documentCategories: DocumentCategory[];
  setDocumentCategories: React.Dispatch<React.SetStateAction<DocumentCategory[]>>;
  executiveId: string;
  onRefresh: () => Promise<void>;
}

// --- Category Management Components ---
const CategoryForm: React.FC<{ category: Partial<DocumentCategory>, onSave: (cat: DocumentCategory) => void, onCancel: () => void }> = ({ category, onSave, onCancel }) => {
    const [name, setName] = useState(category.name || '');
    const [color, setColor] = useState(category.color || '#64748b');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        onSave({ id: category.id || `dc_${new Date().getTime()}`, name, color });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <AppLabel htmlFor="cat-name">Nome da Categoria</AppLabel>
                <AppInput id="cat-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1" />
            </div>
            <TypeColorFormField
                id="doc-cat-color"
                label="Cor da etiqueta"
                value={color}
                onChange={setColor}
            />
            <FormActions>
                <AppButton type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </AppButton>
                <AppButton type="submit" variant="primary">
                    Salvar
                </AppButton>
            </FormActions>
        </form>
    );
};

const CategorySettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    categories: DocumentCategory[];
    setCategories: React.Dispatch<React.SetStateAction<DocumentCategory[]>>;
    onRefresh: () => Promise<void>;
}> = ({ isOpen, onClose, categories, setCategories, onRefresh }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<DocumentCategory> | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<DocumentCategory | null>(null);
    const [categoryActionError, setCategoryActionError] = useState<string | null>(null);

    const handleSave = async (category: DocumentCategory) => {
        setCategoryActionError(null);
        try {
            if (editingCategory?.id) {
                await documentCategoryService.update(category.id, { name: category.name, color: category.color });
            } else {
                await documentCategoryService.create({ name: category.name, color: category.color });
            }
            await onRefresh();
            setFormOpen(false);
            setEditingCategory(null);
        } catch (error) {
            console.error('Erro ao salvar categoria de documento:', error);
            setCategoryActionError(getApiErrorMessage(error, 'Erro ao salvar categoria de documento.'));
        }
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;
        setCategoryActionError(null);
        try {
            await documentCategoryService.delete(categoryToDelete.id);
            await onRefresh();
            setCategoryToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir categoria de documento:', error);
            setCategoryActionError(getApiErrorMessage(error, 'Erro ao excluir categoria de documento.'));
        }
    };
    
    if (!isOpen) return null;

    return (
        <Modal title="Categorias" onClose={onClose}>
             <div className="space-y-4">
                <FormDangerAlert message={categoryActionError} />
                <div className="flex justify-end">
                    <AppButton
                        type="button"
                        variant="primary"
                        className="!p-2"
                        title="Adicionar categoria de documento"
                        aria-label="Adicionar categoria de documento"
                        onClick={() => { setEditingCategory({}); setFormOpen(true); }}
                    >
                        <PlusIcon />
                    </AppButton>
                </div>
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {categories.map(cat => (
                       <li key={cat.id} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <TypeColorSwatch color={cat.color} size="md" />
                                <span className="truncate font-medium text-slate-800">{cat.name}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <button type="button" aria-label="Editar categoria" onClick={() => { setEditingCategory(cat); setFormOpen(true); }} className={typeMgmtEditIconBtn}><EditIcon /></button>
                                <button type="button" aria-label="Excluir categoria" onClick={() => setCategoryToDelete(cat)} className={typeMgmtDeleteIconBtn}><DeleteIcon /></button>
                            </div>
                        </li>
                    ))}
                    {categories.length === 0 && <p className="text-center text-slate-500 py-4">Nenhuma categoria cadastrada.</p>}
                </ul>
            </div>
            
            {isFormOpen && (
                <Modal title={editingCategory?.id ? 'Editar categoria' : 'Nova categoria'} onClose={() => setFormOpen(false)}>
                    <CategoryForm category={editingCategory || {}} onSave={handleSave} onCancel={() => { setFormOpen(false); setEditingCategory(null); }} />
                </Modal>
            )}

            {categoryToDelete && (
                 <ConfirmationModal
                    isOpen={!!categoryToDelete}
                    onClose={() => setCategoryToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir a categoria "${categoryToDelete.name}"?`}
                />
            )}
        </Modal>
    );
};


// --- Document Form Component ---
const DocumentForm: React.FC<{ document: Partial<Document>, onSave: (doc: Document) => void | Promise<void>, onCancel: () => void, categories: DocumentCategory[] }> = ({ document, onSave, onCancel, categories }) => {
    const [name, setName] = useState(document.name || '');
    const [categoryId, setCategoryId] = useState(document.categoryId || '');
    const [imageUrl, setImageUrl] = useState(document.imageUrl || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecione um arquivo de imagem válido.');
            return;
        }

        setIsLoading(true);
        setError('');
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageUrl(reader.result as string);
            setIsLoading(false);
        };
        reader.onerror = () => {
            setError('Ocorreu um erro ao ler o arquivo.');
            setIsLoading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !imageUrl || !document.executiveId) {
            setError('Nome do documento e imagem são obrigatórios.');
            return;
        }
        setError('');
        try {
            await Promise.resolve(
                onSave({
                    id: document.id || `doc_${new Date().getTime()}`,
                    executiveId: document.executiveId,
                    name,
                    imageUrl,
                    categoryId,
                    uploadDate: document.uploadDate || new Date().toISOString(),
                }),
            );
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Erro ao salvar documento.'));
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <fieldset disabled={isLoading} className="space-y-4">
                <div>
                    <AppLabel htmlFor="doc-name">Nome/Descrição do Documento</AppLabel>
                    <AppInput id="doc-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1" />
                </div>
                 <div>
                    <AppLabel htmlFor="doc-category">Categoria</AppLabel>
                    <AppSelect id="doc-category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-1">
                        <option value="">Sem Categoria</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </AppSelect>
                </div>
                <div>
                    <AppLabel>Arquivo de Imagem</AppLabel>
                    <div className="mt-2 flex items-center gap-4">
                         {imageUrl && !isLoading && <img src={imageUrl} alt="Preview" className="w-24 h-24 rounded-md object-cover border-2 border-slate-200" />}
                         <div className="flex-1">
                            {isLoading ? (
                                 <div className="flex items-center justify-center gap-2 rounded-md bg-slate-50 p-4 text-sm text-slate-500">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"></div>
                                    <span>Processando imagem...</span>
                                </div>
                            ) : (
                                <>
                                    <label htmlFor="file-upload" className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm transition hover:bg-indigo-50">
                                        <UploadIcon />
                                        <span>{imageUrl ? 'Trocar Imagem' : 'Selecionar Imagem'}</span>
                                    </label>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                    <p className="mt-2 text-xs text-slate-500">Formatos suportados: PNG, JPG, GIF, etc.</p>
                                </>
                            )}
                         </div>
                    </div>
                </div>
            </fieldset>
            <FormDangerAlert message={error || null} />
            <FormActions>
                <AppButton type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </AppButton>
                <AppButton type="submit" variant="primary" disabled={isLoading}>
                    {isLoading ? 'Aguarde...' : 'Salvar Documento'}
                </AppButton>
            </FormActions>
        </form>
    );
};

// --- Main View Component ---
const DocumentsView: React.FC<DocumentsViewProps> = ({ documents, setDocuments, documentCategories, setDocumentCategories, executiveId, onRefresh }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<Partial<Document> | null>(null);
    const [docToDelete, setDocToDelete] = useState<Document | null>(null);
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [docListError, setDocListError] = useState<string | null>(null);
    const [limit, setLimit] = useState(12);
    const [currentPage, setCurrentPage] = useState(1);

    const filteredDocuments = useMemo(() => {
        const sorted = [...documents].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
        if (filterCategory === 'all') return sorted;
        return sorted.filter(doc => doc.categoryId === filterCategory);
    }, [documents, filterCategory]);

    const paginatedDocuments = useMemo(() => {
        const start = (currentPage - 1) * limit;
        return filteredDocuments.slice(start, start + limit);
    }, [filteredDocuments, currentPage, limit]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterCategory, documents, limit]);

    const handleAddDoc = () => {
        setDocListError(null);
        setEditingDoc({ executiveId });
        setModalOpen(true);
    };

    const handleEditDoc = (doc: Document) => {
        setDocListError(null);
        setEditingDoc(doc);
        setModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!docToDelete) return;
        setDocListError(null);
        try {
            await documentService.delete(docToDelete.id);
            await onRefresh();
            setDocToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir documento:', error);
            setDocListError(getApiErrorMessage(error, 'Erro ao excluir documento.'));
        }
    };

    const handleSaveDoc = async (doc: Document) => {
        if (editingDoc?.id) {
            await documentService.update(doc.id, doc);
        } else {
            await documentService.create(doc);
        }
        await onRefresh();
        setModalOpen(false);
        setEditingDoc(null);
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <FormDangerAlert message={docListError} />
            <div className="flex flex-wrap justify-end items-center gap-2">
                <AppButton
                    type="button"
                    variant="primary"
                    onClick={handleAddDoc}
                    className="!p-2"
                    title="Novo documento"
                    aria-label="Novo documento"
                >
                    <PlusIcon />
                </AppButton>
                <AppButton
                    type="button"
                    variant="ghost"
                    className="!p-2"
                    title="Gerenciar categorias de documento"
                    aria-label="Gerenciar categorias de documento"
                    onClick={() => setCategoryModalOpen(true)}
                >
                    <CogIcon />
                </AppButton>
            </div>

            <ToolbarPanel>
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">Filtrar:</span>
                    <button type="button" onClick={() => setFilterCategory('all')} className={`rounded-full px-3 py-1 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${filterCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Todos
                    </button>
                    {documentCategories.map(cat => (
                         <button key={cat.id} type="button" onClick={() => setFilterCategory(cat.id)} className={`rounded-full px-3 py-1 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${filterCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {cat.name}
                        </button>
                    ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <AppLabel htmlFor="limit-docs" className="mb-0 inline text-slate-600">
                            Itens por página
                        </AppLabel>
                        <AppSelect id="limit-docs" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-auto min-w-[5rem]">
                            <option value={12}>12</option>
                            <option value={24}>24</option>
                            <option value={48}>48</option>
                        </AppSelect>
                    </div>
                </div>
            </ToolbarPanel>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {paginatedDocuments.map(doc => {
                    const category = documentCategories.find(c => c.id === doc.categoryId);
                    return (
                        <div key={doc.id} className="bg-white rounded-xl shadow-md overflow-hidden group">
                            <div className="relative">
                                <button onClick={() => setViewingImage(doc.imageUrl)} className="w-full h-48 block">
                                    <img src={doc.imageUrl} alt={doc.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                </button>
                                 <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" aria-label="Editar documento" onClick={() => handleEditDoc(doc)} className={`${typeMgmtEditIconBtn} bg-white/80 backdrop-blur-sm shadow hover:bg-white`}><EditIcon /></button>
                                    <button type="button" aria-label="Excluir documento" onClick={() => setDocToDelete(doc)} className={`${typeMgmtDeleteIconBtn} bg-white/80 backdrop-blur-sm shadow hover:bg-white`}><DeleteIcon /></button>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-slate-800 truncate">{doc.name}</h3>
                                <div className="flex justify-between items-center mt-2 text-sm">
                                    <p className="text-slate-500">{formatDate(doc.uploadDate)}</p>
                                    {category && <span className="text-xs bg-slate-200 text-slate-600 font-semibold px-2 py-1 rounded-full">{category.name}</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
             {filteredDocuments.length === 0 && (
                <div className="col-span-full text-center p-6 bg-white rounded-xl shadow-md">
                    <p className="text-slate-500">Nenhum documento encontrado para este filtro.</p>
                </div>
            )}

            {filteredDocuments.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredDocuments.length}
                    itemsPerPage={limit}
                    onPageChange={setCurrentPage}
                />
            )}
            
            {isModalOpen && (
                <Modal title={editingDoc?.id ? 'Editar documento' : 'Novo documento'} onClose={() => setModalOpen(false)}>
                    <DocumentForm document={editingDoc || {}} onSave={handleSaveDoc} onCancel={() => { setModalOpen(false); setEditingDoc(null); }} categories={documentCategories} />
                </Modal>
            )}

             <CategorySettingsModal 
                isOpen={isCategoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                categories={documentCategories}
                setCategories={setDocumentCategories}
                onRefresh={onRefresh}
            />

            {docToDelete && (
                 <ConfirmationModal
                    isOpen={!!docToDelete}
                    onClose={() => setDocToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir o documento "${docToDelete.name}"?`}
                />
            )}
            
            {viewingImage && (
                <ImageModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
            )}

        </div>
    );
};

export default DocumentsView;