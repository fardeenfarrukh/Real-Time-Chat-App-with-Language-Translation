import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";

// A small, self-contained widget for picking and cropping a profile picture.
// Feels personal: you choose a file, tweak the crop, and hand back the result.
export default function AvatarUploader({ onAvatarChange }) {
  // Raw image data (base64) from the file input
  const [selectedImage, setSelectedImage] = useState(null);

  // Crop settings: position and zoom
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [zoomFactor, setZoomFactor] = useState(1);

  // Pixel coordinates of the cropped area (calculated by Cropper)
  const [cropBox, setCropBox] = useState(null);

  // Handle file input and convert to previewable base64 string
  const handleFileInput = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result);
    reader.readAsDataURL(file);
  };

  // When cropping is done, remember the pixel box
  const handleCropFinish = useCallback((_, areaPixels) => {
    setCropBox(areaPixels);
  }, []);

  // Actually crop the image and send it back to parent
  const handleSaveAvatar = useCallback(async () => {
    if (!selectedImage || !cropBox) return;
    const croppedImage = await getCroppedImg(selectedImage, cropBox);
    // Pass the cropped image back up (ProfilePage or wherever)
    onAvatarChange?.(croppedImage);
  }, [selectedImage, cropBox, onAvatarChange]);

  return (
    <div className="avatar-uploader">
      <input type="file" accept="image/*" onChange={handleFileInput} />

      {selectedImage && (
        <div
          style={{
            position: "relative",
            width: 300,
            height: 300,
            marginTop: "1rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <Cropper
            image={selectedImage}
            crop={cropPosition}
            zoom={zoomFactor}
            aspect={1}
            onCropChange={setCropPosition}
            onZoomChange={setZoomFactor}
            onCropComplete={handleCropFinish}
          />
        </div>
      )}

      {selectedImage && (
        <button
          onClick={handleSaveAvatar}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#4a90e2",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Save Cropped Avatar
        </button>
      )}
    </div>
  );
}
