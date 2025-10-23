import React from 'react';

const SettingsView: React.FC = () => {
    const appVersion = '1.3.0';

    return (
        <div className="space-y-8 animate-fade-in">
             <header>
                <h2 className="text-3xl font-bold text-slate-800">Configurações</h2>
                <p className="text-slate-500 mt-1">Gerencie as configurações da sua aplicação.</p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-slate-700 mb-4 border-b border-slate-200 pb-3">Sobre a Aplicação</h3>
                <p className="text-slate-600">
                    Versão da Aplicação: <span className="font-semibold">{appVersion}</span>
                </p>
                 <p className="text-slate-500 mt-4">
                    Esta área é reservada para futuras configurações da aplicação, como preferências de notificação, temas e integrações.
                </p>
                 <p className="text-slate-500 mt-2">
                    O gerenciamento de dados como importação e exportação agora é realizado diretamente no backend e no banco de dados para maior segurança e integridade.
                </p>
            </div>
        </div>
    );
};

export default SettingsView;
