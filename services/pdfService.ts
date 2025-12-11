import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import { CCCFormData, CityTemplateConfig } from '../types';

/**
 * CONFIGURACIÓN DE PLANTILLAS POR CIUDAD
 * Las imágenes deben estar en la carpeta public/templates/
 */
const CITY_TEMPLATES: Record<string, CityTemplateConfig> = {
  'CALI': {
    // Rutas exactas según tu captura de pantalla (Case Sensitive)
    images: [
      '/templates/CAM1.jpg',
      '/templates/CAM2.jpg',
      '/templates/CAM3.jpg', 
      '/templates/CAM4.jpg', 
      '/templates/CAM5.jpg', 
      '/templates/CAM6.jpg', 
    ],
    fields: {
      // --- DATOS GLOBALES (Encabezados que se repiten) ---
      // Ajusta 'x' y 'y' usando el MODO DISEÑO si no caen perfecto.
      // Coordenadas estimadas para hoja carta estándar (612x792 pts)
      fecha: { x: 280, y: 735, size: 9, isGlobal: true }, 
      recibo: { x: 320, y: 710, size: 9, font: 'Courier', isGlobal: true },
      codigoVerificacion: { x: 380, y: 695, size: 10, font: 'Helvetica-Bold', isGlobal: true },

      // --- PAGINA 1 (Resumen General) ---
      razonSocial: { x: 180, y: 550, size: 9, font: 'Helvetica-Bold', page: 0 },
      nit: { x: 180, y: 535, size: 9, page: 0 },
      matricula: { x: 450, y: 470, size: 9, page: 0 },
      grupoNiif: { x: 450, y: 530, size: 9, page: 0 },
      
      domicilio: { x: 450, y: 600, size: 9, page: 0 },
      ciudad: { x: 450, y: 585, size: 9, page: 0 },
      
      // --- PAGINA 3 (Ejemplo: Representante Legal) ---
      // Nota: Verifica en qué página 'CAM' cae la firma o el representante
      representante: { x: 100, y: 500, size: 9, page: 2 }, 
      cedulaRep: { x: 400, y: 500, size: 9, page: 2 }
    }
  },
  // Configuración de ejemplo para otra ciudad
  'BOGOTA': {
    images: ['/templates/bogota_1.jpg'], // Debes subir esta imagen si vas a usar Bogotá
    fields: {
      razonSocial: { x: 100, y: 700, size: 12, page: 0 }
    }
  }
};

const getAssetUrl = (path: string) => {
  // Elimina la barra inicial si existe para evitar dobles barras con BASE_URL
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};

export const generateCCCPdf = async (data: CCCFormData, debugMode: boolean = false): Promise<void> => {
  // Normalizamos la ciudad para buscar la configuración (ej: "Cali" -> "CALI")
  const cityKey = data.ciudad.toUpperCase().trim();
  
  // Usamos la config de la ciudad o CALI por defecto si no existe
  const config = CITY_TEMPLATES[cityKey] || CITY_TEMPLATES['CALI'];

  try {
    const pdfDoc = await PDFDocument.create();
    
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const courier = await pdfDoc.embedFont(StandardFonts.Courier);

    let imagesLoadedCount = 0;

    // 1. Cargar Imágenes
    for (let i = 0; i < config.images.length; i++) {
        const imgPath = config.images[i];
        const fullUrl = getAssetUrl(imgPath);

        let imgBytes: ArrayBuffer | null = null;
        try {
            const res = await fetch(fullUrl);
            if (res.ok) {
                imgBytes = await res.arrayBuffer();
            } else {
                console.warn(`No se pudo cargar la imagen: ${fullUrl} (Status: ${res.status})`);
            }
        } catch (e) { 
            console.warn(`Error de red al cargar ${fullUrl}`, e); 
        }

        if (imgBytes) {
            let image;
            // Intentar cargar como JPG, si falla intentar PNG
            try {
                image = await pdfDoc.embedJpg(imgBytes);
            } catch (e) {
                try {
                    image = await pdfDoc.embedPng(imgBytes);
                } catch (e2) {
                    console.error(`El archivo ${imgPath} no es ni JPG ni PNG válido.`);
                    continue;
                }
            }

            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0, y: 0, width: image.width, height: image.height,
            });

            imagesLoadedCount++;

            // Dibujar grilla si está en modo diseño
            if (debugMode) {
                drawDebugGrid(page, helvetica, image.width, image.height, i + 1);
            }
        }
    }

    if (imagesLoadedCount === 0) {
        throw new Error(`No se pudo cargar ninguna imagen para ${cityKey}. Verifica que los archivos existan en public/templates/ (ej: CAM1.jpg)`);
    }

    const pages = pdfDoc.getPages();

    // 2. Estampar Datos
    Object.entries(config.fields).forEach(([key, fieldConfig]) => {
      const value = data[key as keyof CCCFormData];
      
      if (value && fieldConfig) {
        const fontToUse = fieldConfig.font === 'Courier' ? courier : 
                          fieldConfig.font === 'Helvetica-Bold' ? helveticaBold : helvetica;

        let targetPages: PDFPage[] = [];
        
        // Determinar en qué páginas va este campo
        if (fieldConfig.isGlobal) {
            targetPages = pages; // En todas
        } else if (fieldConfig.page !== undefined && pages[fieldConfig.page]) {
            targetPages = [pages[fieldConfig.page]]; // En una específica
        }

        targetPages.forEach(p => {
            // Punto rojo de referencia en modo diseño
             if (debugMode) {
                p.drawCircle({ x: fieldConfig.x, y: fieldConfig.y, size: 3, color: rgb(1, 0, 0) });
            }

            p.drawText(value.toString().toUpperCase(), {
                x: fieldConfig.x,
                y: fieldConfig.y,
                size: fieldConfig.size || 10,
                font: fontToUse,
                color: debugMode ? rgb(1, 0, 0) : rgb(0.15, 0.15, 0.15), // Color gris oscuro casi negro
            });
        });
      }
    });

    // 3. Descargar PDF
    const pdfBytes = await pdfDoc.save();
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Certificado_${data.ciudad}_${data.nit}${debugMode ? '_DISEÑO' : ''}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Error generando PDF:", error);
    await createFallbackPdf(error instanceof Error ? error.message : String(error));
  }
};

/**
 * Genera un PDF de error para informar al usuario visualmente
 */
const createFallbackPdf = async (errorMessage: string) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  page.drawText('ERROR AL GENERAR EL DOCUMENTO', { x: 50, y: 350, size: 18, font, color: rgb(1, 0, 0) });
  page.drawText('Detalles técnicos:', { x: 50, y: 310, size: 12, font });
  
  // Dividir mensaje largo
  const words = errorMessage.split(' ');
  let line = '';
  let y = 290;
  
  for (const word of words) {
      if ((line + word).length > 80) {
          page.drawText(line, { x: 50, y, size: 9, font });
          line = '';
          y -= 12;
      }
      line += word + ' ';
  }
  page.drawText(line, { x: 50, y, size: 9, font });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'error_log.pdf';
  link.click();
};

/**
 * Dibuja una cuadrícula para ayudar a ubicar coordenadas X,Y
 */
const drawDebugGrid = (page: PDFPage, font: PDFFont, width: number, height: number, pageNum: number) => {
    const step = 50;
    const fontSize = 8;
    const color = rgb(1, 0, 1); // Magenta

    // Verticales
    for (let x = 0; x <= width; x += step) {
        page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, thickness: 0.5, color, opacity: 0.3 });
        page.drawText(x.toString(), { x: x + 2, y: 10, size: fontSize, font, color });
    }
    // Horizontales
    for (let y = 0; y <= height; y += step) {
        page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: 0.5, color, opacity: 0.3 });
        page.drawText(y.toString(), { x: 5, y: y + 2, size: fontSize, font, color });
    }
    
    page.drawText(`PAGINA ${pageNum} - (Ancho: ${width.toFixed(0)}, Alto: ${height.toFixed(0)})`, { 
        x: 20, y: height - 20, size: 12, font, color: rgb(1,0,0) 
    });
};