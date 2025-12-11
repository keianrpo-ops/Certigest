import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import { CCCFormData, CityTemplateConfig } from '../types';

/**
 * CONFIGURACIÓN MAESTRA DE PLANTILLAS
 */
export const CITY_TEMPLATES: Record<string, CityTemplateConfig> = {
  'CALI': {
    templatePath: '/templates/plantilla_cali.pdf',
    
    fields: {
      // --- ENCABEZADOS (Parte Superior Derecha) ---
      
      // Fecha: Tapamos "// 01:10:43 pm" (o la fecha vieja)
      fecha: { 
        x: 440, y: 720, size: 9, isGlobal: true,
        boxWidth: 120, boxHeight: 12 
      }, 
      
      // Recibo: Tapamos el número y valor. "Recibo No. XXXXX"
      recibo: { 
        x: 380, y: 705, size: 9, font: 'Courier', isGlobal: true,
        boxWidth: 180, boxHeight: 12
      },
      
      // Código verificación: Debajo del recibo.
      codigoVerificacion: { 
        x: 420, y: 692, size: 9, font: 'Helvetica-Bold', isGlobal: true,
        boxWidth: 140, boxHeight: 12
      },

      // --- PAGINA 1: DATOS EMPRESA (Columna Izquierda / Central) ---
      // Basado en alineación visual con "INVERSIONES LA OCCIDENTAL..."
      
      // Razón social:
      razonSocial: { 
        x: 210, y: 563, size: 9, font: 'Helvetica-Bold', page: 0,
        boxWidth: 350, boxHeight: 25 // Caja alta para 2 líneas
      },
      
      // NIT: Justo debajo
      nit: { 
        x: 210, y: 549, size: 9, page: 0,
        boxWidth: 150, boxHeight: 11
      },
      
      // Domicilio principal (Ciudad)
      ciudad: { 
        x: 210, y: 536, size: 9, page: 0,
        boxWidth: 150, boxHeight: 11
      },

      // --- PAGINA 1: COLUMNA DERECHA (Matrícula) ---
      
      // Matrícula No.
      matricula: { 
        x: 420, y: 506, size: 9, page: 0,
        boxWidth: 100, boxHeight: 11
      },
      
      // Grupo NIIF
      grupoNiif: { 
        x: 420, y: 480, size: 9, page: 0,
        boxWidth: 100, boxHeight: 11
      },
      
      // Ubicación (Sección inferior derecha)
      domicilio: { 
        x: 420, y: 412, size: 8, page: 0, // Letra un poco más pequeña si es larga
        boxWidth: 170, boxHeight: 25 // Caja alta para dirección larga
      },
      
      // --- PAGINA DE FIRMA (Página 2 en el PDF de 2 hojas) ---
      // Ajustar x/y para que caiga sobre "RODRIGO CANO" viejo o espacio vacío
      representante: { 
        x: 180, y: 155, size: 9, page: 1, 
        boxWidth: 200, boxHeight: 15
      },
      cedulaRep: { 
        x: 180, y: 143, size: 9, page: 1, 
        boxWidth: 100, boxHeight: 12
      }
    }
  },
  'BOGOTA': {
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

    // --- CARGAR PDF O IMÁGENES ---
    if (config.templatePath) {
        const fullUrl = getAssetUrl(config.templatePath);
        const existingPdfBytes = await fetch(fullUrl).then(res => {
            if (!res.ok) throw new Error(`No se encontró el PDF plantilla en: ${fullUrl}`);
            return res.arrayBuffer();
        });
        pdfDoc = await PDFDocument.load(existingPdfBytes);
    } else if (config.images && config.images.length > 0) {
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

    // --- ESTAMPAR DATOS ---
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
             // 1. "BORRAR" LO QUE HABÍA ANTES (Dibujar parche)
             if (fieldConfig.boxWidth && fieldConfig.boxHeight) {
                p.drawRectangle({
                    x: fieldConfig.x - 2, // Margen izquierdo ligero
                    // Ajuste vertical: Bajamos 2 puntos de la linea base del texto
                    y: fieldConfig.y - 2, 
                    width: fieldConfig.boxWidth,
                    height: fieldConfig.boxHeight,
                    // Si DebugMode = true, el fondo es rojo transparente para ver dónde borra.
                    // Si DebugMode = false, el fondo es BLANCO solido para borrar.
                    color: debugMode ? rgb(1, 0, 0) : rgb(1, 1, 1), 
                    opacity: debugMode ? 0.3 : 1, 
                    borderColor: debugMode ? rgb(1, 0, 0) : undefined,
                    borderWidth: debugMode ? 1 : 0,
                });
             }

             // 2. Ayudas visuales (Punto de anclaje)
             if (debugMode) {
                p.drawCircle({ x: fieldConfig.x, y: fieldConfig.y, size: 2, color: rgb(0, 0, 1) });
                p.drawText(key, {x: fieldConfig.x, y: fieldConfig.y + 10, size: 6, font: helvetica, color: rgb(0,0,1)});
            }

            // 3. Escribir el nuevo texto
            p.drawText(value.toString().toUpperCase(), {
                x: fieldConfig.x,
                y: fieldConfig.y,
                size: fieldConfig.size || 9,
                font: fontToUse,
                color: rgb(0.15, 0.15, 0.15), // Negro suave, se ve más real que negro puro
            });
        });
      }
    });

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