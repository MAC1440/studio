import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const downloadPdf = (elementId: string, filename: string) => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  html2canvas(input, {
    scale: 2, // Higher scale for better quality
    useCORS: true,
  }).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;
    const width = pdfWidth;
    const height = width / ratio;
    
    // If the content is taller than the page, we'll need to split it
    if (height > pdfHeight) {
        let position = 0;
        let page = 1;
        while(position < canvasHeight) {
            if (page > 1) {
                pdf.addPage();
            }
            // Use the original canvas for slicing
            const sliceCanvas = document.createElement('canvas');
            const sliceContext = sliceCanvas.getContext('2d');
            sliceCanvas.width = canvasWidth;
            sliceCanvas.height = pdfHeight * (canvasWidth / pdfWidth);

            const sliceHeight = sliceCanvas.height;
            
            sliceContext?.drawImage(canvas, 0, position, canvasWidth, sliceHeight, 0, 0, canvasWidth, sliceHeight);

            const sliceImgData = sliceCanvas.toDataURL('image/png');
            pdf.addImage(sliceImgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            
            position += sliceHeight;
            page++;
        }
    } else {
         pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    }
    
    pdf.save(`${filename}.pdf`);
  });
};
