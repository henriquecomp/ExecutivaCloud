import React, { useState, useMemo } from 'react';
import { Document, DocumentCategory } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import ImageModal from './ImageModal';
import { EditIcon, DeleteIcon, PlusIcon, SettingsIcon, UploadIcon } from './Icons';

interface DocumentsViewProps {
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  documentCategories: DocumentCategory[];
  setDocumentCategories: React.Dispatch<React.SetStateAction<DocumentCategory[]>>;
  executiveId: string;
}

// --- Category Management Components ---
const CategoryForm: React.FC<{ category: Partial<DocumentCategory>, onSave: (cat: DocumentCategory) => void, onCancel: () => void }> = ({ category, onSave, onCancel }) => {
    const [name, setName] = useState(category.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        onSave({ id: category.id || `dc_${new Date().getTime()}`, name });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="cat-name" className="block text-sm font-medium text-slate-700">Nome da Categoria</label>
                <input type="text" id="cat-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar</button>
            </div>
        </form>
    );
};

const CategorySettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    categories: DocumentCategory[];
    setCategories: React.Dispatch<React.SetStateAction<DocumentCategory[]>>;
}> = ({ isOpen, onClose, categories, setCategories }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<DocumentCategory> | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<DocumentCategory | null>(null);

    const handleSave = (category: DocumentCategory) => {
        setCategories(prev => editingCategory?.id ? prev.map(c => c.id === category.id ? category : c) : [...prev, category]);
        setFormOpen(false);
        setEditingCategory(null);
    };

    const confirmDelete = () => {
        if (!categoryToDelete) return;
        setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
        setCategoryToDelete(null);
    };
    
    if (!isOpen) return null;

    return (
        <Modal title="Gerenciar Categorias de Documento" onClose={onClose}>
             <div className="space-y-4">
                <div className="flex justify-end">
                    <button onClick={() => { setEditingCategory({}); setFormOpen(true); }} className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition text-sm">
                        <PlusIcon /> Adicionar Categoria
                    </button>
                </div>
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {categories.map(cat => (
                       <li key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="font-medium text-slate-800">{cat.name}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setEditingCategory(cat); setFormOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><EditIcon /></button>
                                <button onClick={() => setCategoryToDelete(cat)} className="p-2 text-slate-400 hover:text-red-600"><DeleteIcon /></button>
                            </div>
                        </li>
                    ))}
                    {categories.length === 0 && <p className="text-center text-slate-500 py-4">Nenhuma categoria cadastrada.</p>}
                </ul>
            </div>
            
            {isFormOpen && (
                <Modal title={editingCategory?.id ? 'Editar Categoria' : 'Nova Categoria'} onClose={() => setFormOpen(false)}>
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
const DocumentForm: React.FC<{ document: Partial<Document>, onSave: (doc: Document) => void, onCancel: () => void, categories: DocumentCategory[] }> = ({ document, onSave, onCancel, categories }) => {
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !imageUrl || !document.executiveId) {
            setError('Nome do documento e imagem são obrigatórios.');
            return;
        }
        onSave({
            id: document.id || `doc_${new Date().getTime()}`,
            executiveId: document.executiveId,
            name,
            imageUrl,
            categoryId,
            uploadDate: document.uploadDate || new Date().toISOString(),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={isLoading} className="space-y-4">
                <div>
                    <label htmlFor="doc-name" className="block text-sm font-medium text-slate-700">Nome/Descrição do Documento</label>
                    <input type="text" id="doc-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="doc-category" className="block text-sm font-medium text-slate-700">Categoria</label>
                    <select id="doc-category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Sem Categoria</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Arquivo de Imagem</label>
                    <div className="mt-2 flex items-center gap-4">
                         {imageUrl && !isLoading && <img src={imageUrl} alt="Preview" className="w-24 h-24 rounded-md object-cover border-2 border-slate-200" />}
                         <div className="flex-1">
                            {isLoading ? (
                                 <div className="flex items-center justify-center gap-2 p-4 text-slate-500 bg-slate-50 rounded-md">
                                    <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                                    <span>Processando imagem...</span>
                                </div>
                            ) : (
                                <>
                                    <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-md shadow-sm border border-indigo-300 hover:bg-indigo-50 transition">
                                        <UploadIcon />
                                        <span>{imageUrl ? 'Trocar Imagem' : 'Selecionar Imagem'}</span>
                                    </label>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                    <p className="text-xs text-slate-500 mt-2">Formatos suportados: PNG, JPG, GIF, etc.</p>
                                </>
                            )}
                         </div>
                    </div>
                </div>
            </fieldset>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed">
                    {isLoading ? 'Aguarde...' : 'Salvar Documento'}
                </button>
            </div>
        </form>
    );
};

// --- Main View Component ---
const DocumentsView: React.FC<DocumentsViewProps> = ({ documents, setDocuments, documentCategories, setDocumentCategories, executiveId }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<Partial<Document> | null>(null);
    const [docToDelete, setDocToDelete] = useState<Document | null>(null);
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [viewingImage, setViewingImage] = useState<string | null>(null);


    const filteredDocuments = useMemo(() => {
        const sorted = [...documents].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
        if (filterCategory === 'all') return sorted;
        return sorted.filter(doc => doc.categoryId === filterCategory);
    }, [documents, filterCategory]);

    const handleAddDoc = () => {
        setEditingDoc({ executiveId });
        setModalOpen(true);
    };

    const handleEditDoc = (doc: Document) => {
        setEditingDoc(doc);
        setModalOpen(true);
    };

    const confirmDelete = () => {
        if (!docToDelete) return;
        setDocuments(prev => prev.filter(d => d.id !== docToDelete.id));
        setDocToDelete(null);
    };

    const handleSaveDoc = (doc: Document) => {
        setDocuments(prev => editingDoc?.id ? prev.map(d => d.id === doc.id ? doc : d) : [...prev, doc]);
        setModalOpen(false);
        setEditingDoc(null);
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Documentos</h2>
                    <p className="text-slate-500 mt-1">Repositório de imagens e documentos importantes.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <button onClick={handleAddDoc} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition">
                        <PlusIcon />
                        Novo Documento
                    </button>
                     <button onClick={() => setCategoryModalOpen(true)} className="p-2 bg-indigo-100 text-indigo-700 rounded-md shadow-sm hover:bg-indigo-200 transition" aria-label="Gerenciar Categorias">
                        <SettingsIcon />
                    </button>
                </div>
            </header>

            <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 mb-3 flex-wrap gap-y-2">
                    <span className="text-sm font-medium text-slate-600">Filtrar:</span>
                    <button onClick={() => setFilterCategory('all')} className={`px-3 py-1 text-sm rounded-full transition ${filterCategory === 'all' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Todos
                    </button>
                    {documentCategories.map(cat => (
                         <button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={`px-3 py-1 text-sm rounded-full transition ${filterCategory === cat.id ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredDocuments.map(doc => {
                    const category = documentCategories.find(c => c.id === doc.categoryId);
                    return (
                        <div key={doc.id} className="bg-white rounded-xl shadow-md overflow-hidden group">
                            <div className="relative">
                                <button onClick={() => setViewingImage(doc.imageUrl)} className="w-full h-48 block">
                                    <img src={doc.imageUrl} alt={doc.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                </button>
                                 <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditDoc(doc)} className="p-2 bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:text-indigo-600 rounded-full transition shadow"><EditIcon /></button>
                                    <button onClick={() => setDocToDelete(doc)} className="p-2 bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:text-red-600 rounded-full transition shadow"><DeleteIcon /></button>
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
            
            {isModalOpen && (
                <Modal title={editingDoc?.id ? 'Editar Documento' : 'Novo Documento'} onClose={() => setModalOpen(false)}>
                    <DocumentForm document={editingDoc || {}} onSave={handleSaveDoc} onCancel={() => { setModalOpen(false); setEditingDoc(null); }} categories={documentCategories} />
                </Modal>
            )}

             <CategorySettingsModal 
                isOpen={isCategoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                categories={documentCategories}
                setCategories={setDocumentCategories}
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