let textures = {
    pepe: ["imgs/pepe.png", [512, 512]],
    dulri: ["imgs/dulri.png", [256, 256]],
    skybox: ["imgs/skybox2.png", [1024, 768]]
};

let loadedResources = 0;
const resourceReady = Object.keys(textures).length;

function loadTextures() {
    for (const key in textures) {
        if (Object.hasOwnProperty.call(textures, key)) {
            const imageURL = textures[key][0];
            const imageWidth = textures[key][1][0];
            const imageHeight = textures[key][1][1];

            let image = new Image();
            image.src = imageURL;
            image.crossOrigin = "Anonymous";
            image.onload = () => {
                cvs.setAttribute("width", imageWidth + "px");
                cvs.setAttribute("height", imageHeight + "px");
                gfx.drawImage(image, 0, 0, imageWidth, imageHeight);

                if (key == "skybox") {
                    const size = int(imageWidth / 4);

                    let top = gfx.getImageData(size, 0, size, size);
                    let bottom = gfx.getImageData(size, size * 2, size, size);
                    let front = gfx.getImageData(size, size, size, size);
                    let back = gfx.getImageData(size * 3, size, size, size);
                    let right = gfx.getImageData(size * 2, size, size, size);
                    let left = gfx.getImageData(0, size, size, size);

                    textures["skybox_top"] = convertImageDataToBitmap(top, size, size);
                    textures["skybox_bottom"] = convertImageDataToBitmap(bottom, size, size);
                    textures["skybox_front"] = convertImageDataToBitmap(front, size, size);
                    textures["skybox_back"] = convertImageDataToBitmap(back, size, size);
                    textures["skybox_right"] = convertImageDataToBitmap(right, size, size);
                    textures["skybox_left"] = convertImageDataToBitmap(left, size, size);
                    loadedResources++;
                    return;
                }

                image = gfx.getImageData(0, 0, imageWidth, imageHeight);
                image = convertImageDataToBitmap(image, imageWidth, imageHeight);

                textures[key] = image;
                loadedResources++;
            }
        }
    }
}
