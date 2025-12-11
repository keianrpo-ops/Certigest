import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import { CCCFormData, CityTemplateConfig } from '../types';

/**
 * CONFIGURACIÓN MAESTRA DE PLANTILLAS
 */
export const CITY_TEMPLATES: Record<string, CityTemplateConfig> = {
  'CALI': {
    // AHORA USAMOS EL PDF DIRECTO. 
    // Asegúrate de guardar el archivo en public/templates/plantilla_cali.pdf
    templatePath: '/templates/plantilla_cali.pdf',
    
    fields: {
      // --- ENCABEZADOS (Ajustados visualmente a tu captura) ---
      // Fecha arriba derecha. "Fecha expedición: // 01:10:43 pm"
      fecha: { x: 370, y: 708, size: 9, isGlobal: true }, 
      
      // Recibo centrado arriba. "Recibo No. XXXXX"
      recibo: { x: 280, y: 685, size: 10, font: 'Courier', isGlobal: true },
      
      // Código verificación debajo de recibo. "0822PPZZJ6"
      codigoVerificacion: { x: 350, y: 672, size: 10, font: 'Helvetica-Bold', isGlobal: true },

      // --- PAGINA 1: DATOS EMPRESA ---
      // Razón social (Nombre, Identificación y Domicilio)
      razonSocial: { x: 200, y: 562, size: 9, font: 'Helvetica-Bold', page: 0 },
      
      // NIT debajo
      nit: { x: 200, y: 548, size: 9, page: 0 },
      
      // Domicilio principal (ciudad)
      ciudad: { x: 200, y: 535, size: 9, page: 0 },

      // Matrícula (Columna derecha, bloque Matrícula)
      matricula: { x: 420, y: 505, size: 9, page: 0 },
      
      // Grupo NIIF (Debajo de matrícula)
      grupoNiif: { x: 420, y: 478, size: 9, page: 0 },
      
      // Ubicación (Sección inferior)
      domicilio: { x: 420, y: 410, size: 9, page: 0 },
      
      // --- PAGINA DE FIRMA (Ajustar según tu PDF, asumo pag 2 o ultima) ---
      // Si tu PDF ya tiene la firma como imagen, no necesitas poner nada aquí.
      // Si necesitas poner el nombre del rep legal:
      representante: { x: 100, y: 200, size: 9, page: 1 }, // Pagina 2 (index 1)
      cedulaRep: { x: 100, y: 190, size: 9, page: 1 }
    }
  },
  'BOGOTA': {
    // Ejemplo híbrido: Si no hay PDF, usa imágenes
    images: ['/templates/BOG1.jpg'], 
    fields: {
      fecha: { x: 400, y: 750, size: 10, isGlobal: true },
      recibo: { x: 50, y: 750, size: 10, font: 'Courier', isGlobal: true },
      razonSocial: { x: 100, y: 650, size: 11, font: 'Helvetica-Bold', page: 0 },
    }
  }
};

export const getAvailableCities = () => {
    return Object.keys(CITY_TEMPLATES);
};

const getAssetUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};

export const generateCCCPdf = async (data: CCCFormData, debugMode: boolean = false): Promise<void> => {
  const cityKey = data.ciudad.toUpperCase().trim();
  const config = CITY_TEMPLATES[cityKey];

  if (!config) {
     throw new Error(`No existe configuración de plantilla para la ciudad: ${cityKey}`);
  }

  try {
    let pdfDoc: PDFDocument;

    // --- ESTRATEGIA 1: CARGAR PDF PLANTILLA (MEJOR CALIDAD) ---
    if (config.templatePath) {
        const fullUrl = getAssetUrl(config.templatePath);
        const existingPdfBytes = await fetch(fullUrl).then(res => {
            if (!res.ok) throw new Error(`No se encontró el PDF plantilla en: ${fullUrl}`);
            return res.arrayBuffer();
        });
        // Cargamos el PDF existente
        pdfDoc = await PDFDocument.load(existingPdfBytes);
    } 
    // --- ESTRATEGIA 2: CARGAR IMÁGENES (LEGADO) ---
    else if (config.images && config.images.length > 0) {
        pdfDoc = await PDFDocument.create();
        for (let i = 0; i < config.images.length; i++) {
            const imgPath = config.images[i];
            const fullUrl = getAssetUrl(imgPath);
            const imgBytes = await fetch(fullUrl).then(res => res.arrayBuffer());
            
            let image;
            try { image = await pdfDoc.embedJpg(imgBytes); } 
            catch { image = await pdfDoc.embedPng(imgBytes); }

            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
    } else {
        throw new Error("La configuración de la ciudad no tiene ni templatePath ni images.");
    }
    
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const courier = await pdfDoc.embedFont(StandardFonts.Courier);

    const pages = pdfDoc.getPages();

    // Estampar Datos
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
             // Dibujar punto rojo en Modo Diseño
             if (debugMode) {
                const { width, height } = p.getSize();
                // Dibujar grilla solo una vez por página si es necesario, 
                // pero aquí solo dibujamos el punto del campo
                p.drawCircle({ x: fieldConfig.x, y: fieldConfig.y, size: 3, color: rgb(1, 0, 0) });
                p.drawText(`${key} (${fieldConfig.x},${fieldConfig.y})`, {
                    x: fieldConfig.x + 5, y: fieldConfig.y + 5, size: 6, font: helvetica, color: rgb(1, 0, 0)
                });
            }

            p.drawText(value.toString().toUpperCase(), {
                x: fieldConfig.x,
                y: fieldConfig.y,
                size: fieldConfig.size || 10,
                font: fontToUse,
                color: debugMode ? rgb(1, 0, 0) : rgb(0.15, 0.15, 0.15),
            });
        });
      }
    });

    // Si estamos en modo diseño, dibujamos la grilla en TODAS las páginas
    if (debugMode) {
        pages.forEach((page, index) => {
            const { width, height } = page.getSize();
            drawDebugGrid(page, helvetica, width, height, index + 1);
        });
    }

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
  
  page.drawText('ERROR', { x: 50, y: 350, size: 18, font, color: rgb(1, 0, 0) });
  
  const words = errorMessage.split(' ');
  let line = '';
  let y = 300;
  
  for (const word of words) {
      if ((line + word).length > 70) {
          page.drawText(line, { x: 50, y, size: 10, font });
          line = '';
          y -= 14;
      }
      line += word + ' ';
  }
  page.drawText(line, { x: 50, y, size: 10, font });

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
    
    page.drawText(`PAGINA ${pageNum} - (Ancho: ${width.toFixed(0)}, Alto: ${height.toFixed(0)})`, { 
        x: 20, y: height - 20, size: 12, font, color: rgb(1,0,0) 
    });
};