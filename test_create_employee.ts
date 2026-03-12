import * as dotenv from 'dotenv';
dotenv.config();

async function testApiSave() {
    const { api } = await import('./src/services/api');
    try {
        console.log('Logging in...');
        await api.loginWithPin('123456', true);

        console.log('Saving employee...');
        const data = {
            id: undefined,
            name: 'Test via API Dynamic',
            role: 'waiter',
            pin: '334455',
            active: true,
        };

        await api.saveEmployee(data);
        console.log('Saved successfully');
    } catch (error: any) {
        console.error('Error detail:', error);
    }
}

testApiSave();
