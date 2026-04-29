
import axios from 'axios';

async function testApi() {
    try {
        console.log('Fetching inventory...');
        const response = await axios.get('http://localhost:5000/api/sports/inventory', {
            headers: {
                'x-user-id': '1',
                'x-user-role': 'Admin',
                'x-user-name': 'Test Admin'
            }
        });
        console.log('Response status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (err: any) {
        if (err.response) {
            console.error('API Error:', err.response.status, err.response.data);
        } else {
            console.error('Network Error:', err.message);
        }
    }
}

testApi();
