const axios = require('axios');

const testData = {
  tyres: [
    { serial: 'ZA001', brand: 'Bridgestone', status: 'Passed' },
    { serial: 'ZA002', brand: 'Michelin', status: 'Rejected' }
  ],
  vehicles: [
    { plate: 'CA12345', type: 'Truck', depot: 'Cape Town' },
    { plate: 'GP99887', type: 'Bus', depot: 'Johannesburg' }
  ],
  companies: [
    { name: 'Wellington Group', contact: 'wellington@example.com' }
  ],
  depots: [
    { name: 'Cape Town', region: 'Western Cape' },
    { name: 'Durban', region: 'KwaZulu-Natal' }
  ],
  users: [
    { username: 'zuri_admin', role: 'Administrator' },
    { username: 'kurtj', role: 'Inspector' }
  ]
};

(async () => {
  for (const key in testData) {
    console.log(`⏳ Seeding table: ${key}`);
    try {
      const res = await axios.post(`http://localhost:5000/api/table/${key}`, testData[key]);
      console.log(`✅ ${key}: Status ${res.status}`);
    } catch (err) {
      console.error(`❌ ${key}:`, err.message);
      if (err.response?.data) {
        console.error('Server Response:', err.response.data);
      }
    }
  }
})();
