import React, { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';

interface LoginProps {
    onLogin: (pin: string) => void;
    error?: string;
    isLoading?: boolean;
}

export default function Login({ onLogin, error, isLoading }: LoginProps) {
    const [pin, setPin] = useState('');

    const handleKeyPress = (num: string) => {
        if (isLoading) return;
        if (pin.length < 6) {
            setPin(prev => prev + num);
            if (pin.length === 5) {
                onLogin(pin + num);
                // We don't reset pin here immediately so the UI doesn't flash if error.
                // It stays filled or they press delete. Or next keypress clears it if we wanted to.
            }
        }
    };

    const handleDelete = () => {
        if (isLoading) return;
        setPin(prev => prev.slice(0, -1));
    };

    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 z-50">
            <div className="w-full max-w-sm flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-6">
                    {isLoading ? (
                        <Loader2 size={32} className="text-blue-500 animate-spin" />
                    ) : (
                        <Lock size={32} className="text-blue-500" />
                    )}
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h2>
                <p className="text-slate-400 mb-8 text-center">Digite o PIN de 6 dígitos para acessar o sistema.</p>

                {/* PIN Display */}
                <div className="flex gap-3 mb-10 w-full justify-center">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-blue-500 scale-110 shadow-[0_0_10px_theme(colors.blue.500)]' : 'bg-slate-800'}`}
                        />
                    ))}
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg mb-6 w-full text-center text-sm animate-in shake">
                        {error}
                        <div className="mt-2 text-xs">
                            <button onClick={() => setPin('')} className="underline border border-red-500/30 px-2 py-1 rounded">Limpar PIN e tentar de novo</button>
                        </div>
                    </div>
                )}

                {/* Numpad */}
                <div className={`grid grid-cols-3 gap-4 w-full px-4 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            disabled={isLoading}
                            onClick={() => handleKeyPress(num.toString())}
                            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-blue-500/50 text-white rounded-2xl h-16 text-2xl font-medium transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
                        >
                            {num}
                        </button>
                    ))}
                    <div /> {/* Emtpy slot */}
                    <button
                        disabled={isLoading}
                        onClick={() => handleKeyPress('0')}
                        className="bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-blue-500/50 text-white rounded-2xl h-16 text-2xl font-medium transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
                    >
                        0
                    </button>
                    <button
                        disabled={isLoading}
                        onClick={handleDelete}
                        className="bg-slate-900/50 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded-2xl h-16 text-sm font-medium transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
                    >
                        Apagar
                    </button>
                </div>
            </div>
        </div>
    );
}
