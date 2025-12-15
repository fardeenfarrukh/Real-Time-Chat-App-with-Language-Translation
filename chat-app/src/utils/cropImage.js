import { createImage } from './imageUtils';

// Utility: crop a given image source using the provided crop box
export default async function getCroppedImg(imageSrc, crop) {
  try {
    // Load the image element from the source URL
    const rawImg = await createImage(imageSrc);

    // Prepare a canvas to draw the cropped section
    const workCanvas = document.createElement('canvas');
    const paintCtx = workCanvas.getContext('2d');

    // Match canvas size to the crop dimensions (rounded to whole pixels)
    const targetW = Math.floor(crop.width);
    const targetH = Math.floor(crop.height);

    workCanvas.width = targetW;
    workCanvas.height = targetH;

    // Draw the selected portion of the image
    paintCtx.drawImage(
      rawImg,
      crop.x,       // source x
      crop.y,       // source y
      crop.width,   // source width
      crop.height,  // source height
      0,            // destination x
      0,            // destination y
      targetW,      // destination width
      targetH       // destination height
    );

    // Return the cropped image as a JPEG data URL
    const croppedOutput = workCanvas.toDataURL('image/jpeg');
    return croppedOutput;
  } catch (err) {
    console.error("Error cropping image:", err);
    return null;
  }
}
