import { useState } from 'react';
import api from '../api';

// carId === null  -> "add car" mode: files are staged locally, uploaded by the parent after the car is created.
// carId !== null  -> "edit car" mode: files are uploaded immediately to /api/cars/:id/images.
export default function ImageManager({ carId, existingImages = [], onExistingImagesChange, pendingFiles = [], onPendingFilesChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setError('');

    if (carId === null) {
      onPendingFilesChange([...pendingFiles, ...files]);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const { data } = await api.post(`/cars/${carId}/images`, formData);
      onExistingImagesChange([...existingImages, ...data]);
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de l\'envoi des images');
    } finally {
      setUploading(false);
    }
  }

  async function removeExisting(imageId) {
    try {
      await api.delete(`/cars/${carId}/images/${imageId}`);
      onExistingImagesChange(existingImages.filter(img => img.id !== imageId));
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de la suppression');
    }
  }

  function removePending(index) {
    onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
  }

  return (
    <div className="form-group">
      <label>Photos</label>
      {error && <p className="error">{error}</p>}
      <div className="image-grid">
        {existingImages.map(img => (
          <div className="image-thumb" key={img.id}>
            <img src={img.url} alt="" />
            <button type="button" className="image-thumb-remove" onClick={() => removeExisting(img.id)}>×</button>
          </div>
        ))}
        {pendingFiles.map((file, i) => (
          <div className="image-thumb" key={`pending-${i}`}>
            <img src={URL.createObjectURL(file)} alt="" />
            <button type="button" className="image-thumb-remove" onClick={() => removePending(i)}>×</button>
          </div>
        ))}
        <label className="image-add-btn">
          {uploading ? '…' : '+'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={handleFiles} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}
