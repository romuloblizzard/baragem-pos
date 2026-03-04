import { Link } from 'react-router-dom';
import { Beer, ClipboardList } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 text-center space-y-8 max-w-md w-full">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Baragem POS
          </h1>
          <p className="text-slate-400">Sistema de Gestão de Bar</p>
        </div>

        <div className="grid gap-4">
          <Link 
            to="/manager"
            className="group relative flex items-center gap-4 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all duration-300"
          >
            <div className="p-4 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <ClipboardList size={32} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-slate-200">Painel Gerencial</h3>
              <p className="text-sm text-slate-500">Controle de caixa, estoque e produtos</p>
            </div>
          </Link>

          <Link 
            to="/waiter"
            className="group relative flex items-center gap-4 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all duration-300"
          >
            <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Beer size={32} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-slate-200">Painel do Garçom</h3>
              <p className="text-sm text-slate-500">Novo pedido, lançar itens</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
