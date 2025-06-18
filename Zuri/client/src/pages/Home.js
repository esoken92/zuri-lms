import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL;

function Home({ inspections, setInspections }) {
  const [form, setForm] = useState({
    vehicleId: '',
    tirePosition: '',
    treadDepth: '',
    pressure: '',
    damage: '',
    date: '',
    photo: null,
  });

  const [modalPhoto, setModalPhoto] = useState(null);

  useEffect(() => {
    axios.get(`${BASE_URL}/inspections`)
      .then(res => setInspections(res.data))
      .catch(err => console.error(err));
  }, [setInspections]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    setForm({ ...form, photo: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let photoUrl = '';
    if (form.photo) {
      const formData = new FormData();
      formData.append('photo', form.photo);
      try {
        const uploadRes = await axios.post(`${BASE_URL}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        photoUrl = uploadRes.data.path;
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }

    const payload = {
      vehicleId: form.vehicleId,
      tirePosition: form.tirePosition,
      treadDepth: form.treadDepth,
      pressure: form.pressure,
      damage: form.damage,
      date: form.date,
      photo: photoUrl,
    };

    if (!navigator.onLine) {
      const existing = JSON.parse(localStorage.getItem('pendingInspections') || '[]');
      localStorage.setItem('pendingInspections', JSON.stringify([...existing, payload]));
      alert("You're offline. Inspection saved locally and will sync automatically.");
      return;
    }

    axios.post(`${BASE_URL}/inspections`, payload)
      .then((res) => {
        setInspections([...inspections, { ...payload, id: res.data.id }]);
        setForm({
          vehicleId: '',
          tirePosition: '',
          treadDepth: '',
          pressure: '',
          damage: '',
          date: '',
          photo: null,
        });
      })
      .catch((err) => console.error(err));
  };

  return (
    <div id="report-section">
      <div style={{ maxWidth: '800px', margin: 'auto', padding: '2rem', fontFamily: 'Arial' }}>
        <h1 style={{ textAlign: 'center', color: '#333' }}>Zuri Tire Inspection</h1>

        <form onSubmit={handleSubmit}>
          <input name="vehicleId" placeholder="Vehicle ID" value={form.vehicleId} onChange={handleChange} required /><br /><br />
          <input name="tirePosition" placeholder="Tire Position (e.g. FL, FR)" value={form.tirePosition} onChange={handleChange} required /><br /><br />
          <input name="treadDepth" placeholder="Tread Depth (mm)" type="number" value={form.treadDepth} onChange={handleChange} required /><br /><br />
          <input name="pressure" placeholder="Pressure (bar)" type="number" value={form.pressure} onChange={handleChange} required /><br /><br />
          <input name="damage" placeholder="Any visible damage?" value={form.damage} onChange={handleChange} /><br /><br />
          <input name="date" type="date" value={form.date} onChange={handleChange} required /><br /><br />
          <input type="file" accept="image/*" onChange={handlePhotoChange} /><br /><br />
          <button type="submit">Submit Inspection</button>
        </form>

        <h2 style={{ marginTop: '3rem', color: '#333' }}>Inspection Records</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Date</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Vehicle</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Tire</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Tread (mm)</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Pressure (bar)</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Damage</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Photo</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((insp) => (
              <tr key={insp.id}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{insp.date}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{insp.vehicleId}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{insp.tirePosition}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{insp.treadDepth}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{insp.pressure}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{insp.damage}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {insp.photo ? (
                    <img
                      src={`${BASE_URL}${insp.photo}`}
                      alt="Tire"
                      style={{ width: '60px', height: '40px', cursor: 'pointer', objectFit: 'cover' }}
                      onClick={() => setModalPhoto(`${BASE_URL}${insp.photo}`)}
                    />
                  ) : 'No Photo'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalPhoto && (
        <div
          onClick={() => setModalPhoto(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'zoom-out'
          }}
        >
          <img src={modalPhoto} alt="Enlarged tire" style={{ maxHeight: '80%', maxWidth: '90%' }} />
        </div>
      )}
    </div>
  );
}

export default Home;
