// Load an image from a URL and resolve once it's ready
export function createImage(url) {
  return new Promise((resolve, reject) => {
    // Create a new image element
    const picture = new Image();

    // Handle successful load
    const onLoad = () => resolve(picture);

    // Handle error case
    const onError = (event) => reject(event);

    // Attach listeners
    picture.addEventListener('load', onLoad);
    picture.addEventListener('error', onError);

    // Start loading
    picture.src = url;
  });
}
