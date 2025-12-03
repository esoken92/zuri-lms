const axios = require('axios');

const testData = {
  tyres: [
    { brand: 'Michelin', pattern: 'X Multi HDD', 'Ply Rating': '18PR', 'Original Tread Depth': '22.5', 'Load Rating': '156/150', 'Load Rating Duals': '156', 'Load Rating Singles': '150', 'Speed Rating Duals': 'K', 'Speed Rating Singles': 'L', 'Tube Rating': 'TL', 'Nominal Section Width': '315', 'Aspect Ratio': '65', 'Rim Size': '22.5', 'Product Code': 'PC001' },
    { brand: 'Bridgestone', pattern: 'M840', 'Ply Rating': '16PR', 'Original Tread Depth': '16.5', 'Load Rating': '150/145', 'Load Rating Duals': '150', 'Load Rating Singles': '145', 'Speed Rating Duals': 'J', 'Speed Rating Singles': 'K', 'Tube Rating': 'TL', 'Nominal Section Width': '295', 'Aspect Ratio': '80', 'Rim Size': '22.5', 'Product Code': 'PC002' },
    { brand: 'Continental', pattern: 'HS3', 'Ply Rating': '20PR', 'Original Tread Depth': '15.5', 'Load Rating': '160/150', 'Load Rating Duals': '160', 'Load Rating Singles': '150', 'Speed Rating Duals': 'L', 'Speed Rating Singles': 'M', 'Tube Rating': 'TL', 'Nominal Section Width': '315', 'Aspect Ratio': '70', 'Rim Size': '22.5', 'Product Code': 'PC003' },
    { brand: 'Sumitomo', pattern: 'ST909', 'Ply Rating': '18PR', 'Original Tread Depth': '17', 'Load Rating': '154/150', 'Load Rating Duals': '154', 'Load Rating Singles': '150', 'Speed Rating Duals': 'K', 'Speed Rating Singles': 'L', 'Tube Rating': 'TL', 'Nominal Section Width': '315', 'Aspect Ratio': '80', 'Rim Size': '22.5', 'Product Code': 'PC004' },
    { brand: 'Goodyear', pattern: 'KMAX S', 'Ply Rating': '16PR', 'Original Tread Depth': '17', 'Load Rating': '148/145', 'Load Rating Duals': '148', 'Load Rating Singles': '145', 'Speed Rating Duals': 'J', 'Speed Rating Singles': 'K', 'Tube Rating': 'TL', 'Nominal Section Width': '295', 'Aspect Ratio': '75', 'Rim Size': '22.5', 'Product Code': 'PC005' }
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
