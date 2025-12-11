import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import { CCCFormData, CityTemplateConfig } from '../types';

/**
 * CONFIGURACIÓN DE PLANTILLAS POR CIUDAD (Basado en Imágenes JPG)
 * NOTA: Debes subir las imágenes a la carpeta /public/templates/
 */
const CITY_TEMPLATES: Record<string, CityTemplateConfig> = {
  'CALI': {
    // Lista de imágenes en orden. Asegúrate de tener cali_page_1.jpg hasta la 6 si es necesario.
    images: [
      '/templates/cali_page_1.jpg',
      '/templates/cali_page_2.jpg',
      '/templates/cali_page_3.jpg', 
      '/templates/cali_page_4.jpg', 
      '/templates/cali_page_5.jpg', 
      '/templates/cali_page_6.jpg', 
    ],
    fields: {
      // --- DATOS GLOBALES (Encabezados Centrados) ---
      // Ajustados visualmente para hoja carta (aprox Center X = 200-250 dependiendo del texto)
      fecha: { x: 230, y: 725, size: 9, isGlobal: true }, 
      recibo: { x: 250, y: 700, size: 9, font: 'Courier', isGlobal: true },
      codigoVerificacion: { x: 280, y: 685, size: 10, font: 'Helvetica-Bold', isGlobal: true },

      // --- PAGINA 1 (Resumen) ---
      razonSocial: { x: 180, y: 550, size: 9, font: 'Helvetica-Bold', page: 0 },
      nit: { x: 180, y: 535, size: 9, page: 0 },
      matricula: { x: 450, y: 470, size: 9, page: 0 }, // Según captura 2, columna derecha
      grupoNiif: { x: 450, y: 530, size: 9, page: 0 },
      
      domicilio: { x: 450, y: 600, size: 9, page: 0 }, // Ubicacion aprox
      ciudad: { x: 450, y: 585, size: 9, page: 0 },
      
      // --- PAGINA 3 (Representación Legal - Ejemplo) ---
      representante: { x: 100, y: 500, size: 9, page: 2 }, // Ajustar página según corresponda
      cedulaRep: { x: 400, y: 500, size: 9, page: 2 }
    }
  },
  'BOGOTA': {
    images: ['/templates/bogota_page_1.jpg'],
    fields: {
      razonSocial: { x: 100, y: 700, size: 12, page: 0 }
    }
  }
};

const getAssetUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};

export const generateCCCPdf = async (data: CCCFormData, debugMode: boolean = false): Promise<void> => {
  const cityKey = data.ciudad.toUpperCase().trim();
  const config = CITY_TEMPLATES[cityKey] || CITY_TEMPLATES['CALI'];

  try {
    const pdfDoc = await PDFDocument.create();
    
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const courier = await pdfDoc.embedFont(StandardFonts.Courier);

    // Iterar sobre las imágenes configuradas
    for (let i = 0; i < config.images.length; i++) {
        const imgPath = config.images[i];
        const fullUrl = getAssetUrl(imgPath);

        // Fetch silencioso para no romper si falta una pagina (ej: pagina 6)
        let imgBytes: ArrayBuffer | null = null;
        try {
            const res = await fetch(fullUrl);
            if (res.ok) imgBytes = await res.arrayBuffer();
        } catch (e) { console.warn(`Saltando imagen ${fullUrl}`); }

        if (imgBytes) {
            let image;
            try {
                image = await pdfDoc.embedJpg(imgBytes);
            } catch (e) {
                // Fallback a PNG si la extension miente
                image = await pdfDoc.embedPng(imgBytes);
            }

            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0, y: 0, width: image.width, height: image.height,
            });

            if (debugMode) {
                drawDebugGrid(page, helvetica, image.width, image.height, i + 1);
            }
        }
    }

    const pages = pdfDoc.getPages();
    if (pages.length === 0) throw new Error("No se cargaron imágenes. Verifica la carpeta public/templates");

    Object.entries(config.fields).forEach(([key, fieldConfig]) => {
      const value = data[key as keyof CCCFormData];
      
      if (value && fieldConfig) {
        const fontToUse = fieldConfig.font === 'Courier' ? courier : 
                          fieldConfig.font === 'Helvetica-Bold' ? helveticaBold : helvetica;

        let targetPages: PDFPage[] = [];
        
        if (fieldConfig.isGlobal) {
            targetPages = pages;
        } else if (fieldConfig.page !== undefined && pages[fieldConfig.page]) {
            targetPages = [pages[fieldConfig.page]];
        }

        targetPages.forEach(p => {
             if (debugMode) {
                p.drawCircle({ x: fieldConfig.x, y: fieldConfig.y, size: 3, color: rgb(1, 0, 0) });
            }

            p.drawText(value.toString().toUpperCase(), {
                x: fieldConfig.x,
                y: fieldConfig.y,
                size: fieldConfig.size || 10,
                font: fontToUse,
                color: debugMode ? rgb(1, 0, 0) : rgb(0.15, 0.15, 0.15), // Gris muy oscuro para que parezca tinta
            });
        });
      }
    });

    const pdfBytes = await pdfDoc.save();
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Certificado_${data.ciudad}_${data.nit}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Error generando PDF:", error);
    await createFallbackPdf(error instanceof Error ? error.message : String(error));
  }
};

const createFallbackPdf = async (errorMessage: string) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  page.drawText('ERROR', { x: 50, y: 350, size: 20, font, color: rgb(1, 0, 0) });
  page.drawText('Faltan imágenes en public/templates/', { x: 50, y: 300, size: 12, font });
  page.drawText(`Detalle: ${errorMessage}`, { x: 50, y: 250, size: 10, font });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'error_log.pdf';
  link.click();
};

const drawDebugGrid = (page: PDFPage, font: PDFFont, width: number, height: number, pageNum: number) => {
    const step = 50;
    const fontSize = 8;
    const color = rgb(1, 0, 1);

    for (let x = 0; x <= width; x += step) {
        page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, thickness: 0.5, color, opacity: 0.3 });
        page.drawText(x.toString(), { x: x + 2, y: 10, size: fontSize, font, color });
    }
    for (let y = 0; y <= height; y += step) {
        page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: 0.5, color, opacity: 0.3 });
        page.drawText(y.toString(), { x: 5, y: y + 2, size: fontSize, font, color });
    }
    page.drawText(`PÁGINA ${pageNum}`, { x: 20, y: height - 20, size: 14, font, color: rgb(1,0,0) });
};