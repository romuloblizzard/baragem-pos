import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAllLogins() {
    console.log('Buscando todos os funcionarios e gerentes ativos...');
    const { data: employees, error: fetchError } = await supabase
        .from('employees')
        .select('name, pin, role');

    if (fetchError || !employees) {
        console.error('Erro ao buscar funcionarios:', fetchError);
        return;
    }

    console.log(`Encontrados ${employees.length} pessoas na equipe. Testando logins...\n`);

    for (const emp of employees) {
        if (!emp.pin) {
            console.log(`??  Ignorando ${emp.name} (Sem PIN configurado)`);
            continue;
        }

        const fakeEmail = `${emp.pin}@baragem.local`;
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: fakeEmail,
            password: emp.pin
        });

        if (error) {
            console.log(`? FALHA: ${emp.name} (${emp.role}) - PIN: ${emp.pin} - Erro: ${error.message}`);
        } else {
            console.log(`? SUCESSO: ${emp.name} (${emp.role}) - PIN: ${emp.pin}`);
            await supabase.auth.signOut();
        }
    }
}

testAllLogins();
