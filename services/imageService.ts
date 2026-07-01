
/**
 * Uploads a base64 image to ImgBB and returns the display URL.
 */
export const uploadImageToImgbb = async (base64Image: string): Promise<string | null> => {
    try {
        const formData = new FormData();
        // Remove header if present (e.g., "data:image/jpeg;base64,")
        const cleanedBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
        formData.append('image', cleanedBase64);
        
        // API Key provided by user
        const API_KEY = 'c2a1f15a734d94cb778b02d8ee32da36'; 
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            return data.data.url;
        } else {
            console.error("ImgBB Upload Error:", data.error);
            return null;
        }
    } catch (error) {
        console.error("Failed to upload image:", error);
        return null;
    }
};
