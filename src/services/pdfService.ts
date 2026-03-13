import * as pdfjs from 'pdfjs-dist';

// Configurar o worker do PDF.js (usando CDN para simplicidade no browser)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export const pdfService = {
    async extractText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
                    const pdf = await pdfjs.getDocument(typedarray).promise;
                    let fullText = "";

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items
                            .map((item: any) => item.str)
                            .join(" ");
                        fullText += pageText + "\n";
                    }

                    resolve(fullText);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }
};
