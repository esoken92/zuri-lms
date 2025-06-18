import React, { useState } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL;

const vehicleLayouts = {
  'Passenger Car': ['FL', 'FR', 'RL', 'RR'],
  'Commercial Truck': ['FL', 'FR', 'ML', 'MR', 'RL', 'RR'],
  'Bus': ['FL', 'FR', 'ML', 'MR', 'RL', 'RR'],
  'Trailer': ['RL', 'RR'],
};

function InspectionForm({ onSubmit }) {
  const [form, setForm] = useState({
    vehicleId: '',
    vehicleType: 'Passenger Car',
    tirePosition: '',
    treadDepth: '',
    pressure: '',
    damage: '',
    date: '',
    photo: null,
  });

  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, photo: file });
    setPreview(URL.createObjectURL(file));
  };

  const handleTireClick = (pos) => {
    setForm({ ...form, tirePosition: pos });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let photoUrl = '';
    if (form.photo) {
      const formData = new FormData();
      formData.append('photo', form.photo);
      try {
        const uploadRes = await axios.post(`${BASE_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        photoUrl = uploadRes.data.path;
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

    const payload = { ...form, photo: photoUrl };
    delete payload.photoFile;
    axios.post(`${BASE_URL}/inspections`, payload)
      .then(res => {
        onSubmit && onSubmit();
        setForm({
          vehicleId: '',
          vehicleType: 'Passenger Car',
          tirePosition: '',
          treadDepth: '',
          pressure: '',
          damage: '',
          date: '',
          photo: null,
        });
        setPreview(null);
      })
      .catch(err => console.error(err));
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
      <input name="vehicleId" placeholder="Vehicle ID" value={form.vehicleId} onChange={handleChange} required /><br /><br />

      <label>Vehicle Type:</label>
      <select name="vehicleType" value={form.vehicleType} onChange={handleChange}>
        {Object.keys(vehicleLayouts).map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select><br /><br />

      <label>Click a Tire:</label>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {vehicleLayouts[form.vehicleType].map(pos => (
          <div
            key={pos}
            onClick={() => handleTireClick(pos)}
            style={{
              width: '60px', height: '60px', border: '2px solid', cursor: 'pointer',
              backgroundColor: form.tirePosition === pos ? 'lightgreen' : '#eee',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {pos}
          </div>
        ))}
      </div>

      <input name="tirePosition" placeholder="Or enter manually (e.g. FL)" value={form.tirePosition} onChange={handleChange} required /><br /><br />
      <input name="treadDepth" placeholder="Tread Depth (mm)" type="number" value={form.treadDepth} onChange={handleChange} required /><br /><br />
      <input name="pressure" placeholder="Pressure (bar)" type="number" value={form.pressure} onChange={handleChange} required /><br /><br />
      <input name="damage" placeholder="Any visible damage?" value={form.damage} onChange={handleChange} /><br /><br />
      <input name="date" type="date" value={form.date} onChange={handleChange} required /><br /><br />
      <input type="file" accept="image/*" onChange={handlePhotoChange} /><br /><br />
      {preview && <img src={preview} alt="Preview" style={{ width: '100px' }} />}<br /><br />

      <button type="submit">Submit Inspection</button>
    </form>
  );
}

export default InspectionForm;
