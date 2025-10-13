import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";

export default function AvatarUploader({ onAvatarChange }) {
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_, area) => {
    setCroppedAreaPixels(area);
  }, []);

  const cropAndSave = useCallback(async () => {
    if (!image || !croppedAreaPixels) return;
    const cropped = await getCroppedImg(image, croppedAreaPixels);
    onAvatarChange?.(cropped); // pass cropped image back to ProfilePage
  }, [image, croppedAreaPixels, onAvatarChange]);

  return (
    <div className="avatar-uploader">
      <input type="file" accept="image/*" onChange={onFileChange} />
      {image && (
        <div style={{ position: "relative", width: 300, height: 300, marginTop: "1rem" }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      )}
      {image && (
        <button onClick={cropAndSave} style={{ marginTop: "1rem" }}>
          Crop & Save
        </button>
      )}
    </div>
  );
}
