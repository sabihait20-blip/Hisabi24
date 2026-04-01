import { jsPDF } from 'jspdf';

const FONT_URL_REGULAR = 'https://fonts.gstatic.com/s/hindsiliguri/v14/ijwTs5juQtsyLLR5jN4cxBEofJs.ttf';
const FONT_URL_BOLD = 'https://fonts.gstatic.com/s/hindsiliguri/v14/ijwOs5juQtsyLLR5jN4cxBEoRCf_4uE.ttf';

async function fetchFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function addBengaliFont(doc: jsPDF) {
  try {
    const [regularBase64, boldBase64] = await Promise.all([
      fetchFontAsBase64(FONT_URL_REGULAR),
      fetchFontAsBase64(FONT_URL_BOLD)
    ]);

    doc.addFileToVFS('HindSiliguri-Regular.ttf', regularBase64);
    doc.addFont('HindSiliguri-Regular.ttf', 'HindSiliguri', 'normal');
    
    doc.addFileToVFS('HindSiliguri-Bold.ttf', boldBase64);
    doc.addFont('HindSiliguri-Bold.ttf', 'HindSiliguri', 'bold');
    
    doc.setFont('HindSiliguri');
  } catch (error) {
    console.error('Error loading Bengali font for PDF:', error);
  }
}
