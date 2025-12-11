import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import { CCCFormData, CityTemplateConfig } from '../types';

/**
 * CONFIGURACIÓN MAESTRA DE PLANTILLAS
 */
export const CITY_TEMPLATES: Record<string, CityTemplateConfig> = {
  'CALI': {
    templatePath: '/templates/plantilla_cali.pdf',
    
    fields: {
      // --- ENCABEZADOS GLOBAL (Tapan la fecha y códigos viejos) ---
      
      // Fecha: Está arriba a la derecha. Tapamos "// 01:10:43 pm"
      fecha: { 
        x: 380, y: 708, size: 9, isGlobal: true,
        boxWidth: 150, boxHeight: 12 
      }, 
      
      // Recibo: Centro arriba. Tapamos "570875, Valor: $0" (o lo que haya)
      recibo: { 
        x: 280, y: 685, size: 10, font: 'Courier', isGlobal: true,
        boxWidth: 200, boxHeight: 15
      },
      
      // Código verificación: Debajo del recibo. Tapamos "0822PPZZJ6"
      codigoVerificacion: { 
        x: 350, y: 672, size: 10, font: 'Helvetica-Bold', isGlobal: true,
        boxWidth: 150, boxHeight: 12
      },

      // --- PAGINA 1: DATOS EMPRESA (Tapan INVERSIONES LA OCCIDENTAL...) ---
      
      // Razón social: Tapamos "INVERSIONES LA OCCIDENTAL CALI LTDA..."
      razonSocial: { 
        x: 200, y: 562, size: 9, font: 'Helvetica-Bold', page: 0,
        boxWidth: 350, boxHeight: 25 // Caja alta por si tiene 2 líneas
      },
      
      // NIT: Tapamos "8903048824"
      nit: { 
        x: 200, y: 548, size: 9, page: 0,
        boxWidth: 100, boxHeight: 12
      },
      
      // Domicilio principal: Tapamos "CALI"
      ciudad: { 
        x: 200, y: 535, size: 9, page: 0,
        boxWidth: 100, boxHeight: 12
      },

      // --- COLUMNA DERECHA ---
      
      // Matrícula: Tapamos "264544"
      matricula: { 
        x: 420, y: 505, size: 9, page: 0,
        boxWidth: 100, boxHeight: 12
      },
      
      // Grupo NIIF: Tapamos "Grupo 3"
      grupoNiif: { 
        x: 420, y: 478, size: 9, page: 0,
        boxWidth: 100, boxHeight: 12
      },
      
      // Ubicación (Sección inferior) - Tapamos "AVENIDA 5 A..."
      domicilio: { 
        x: 420, y: 410, size: 9, page: 0,
        boxWidth: 150, boxHeight: 12
      },
      
      // --- PAGINA DE FIRMA (Pagina 2 o ultima según tu PDF) ---
      // Si quieres tapar el nombre del representante antiguo abajo a la derecha o izquierda
      representante: { 
        x: 100, y: 150, size: 9, page: 1, // Página 2
        boxWidth: 200, boxHeight: 20
      },
      cedulaRep: { 
        x: 100, y: 140, size: 9, page: 1, // Página 2
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
             // 1. "BORRAR" LO QUE HABÍA ANTES (Dibujar parche blanco)
             // Esto es vital para PDFs que ya tienen texto
             if (fieldConfig.boxWidth && fieldConfig.boxHeight) {
                p.drawRectangle({
                    x: fieldConfig.x,
                    // Bajamos un poco Y (-2) para cubrir letras que cuelgan (g, j, p)
                    y: fieldConfig.y - 3, 
                    width: fieldConfig.boxWidth,
                    height: fieldConfig.boxHeight,
                    color: rgb(1, 1, 1), // BLANCO PURO
                    opacity: debugMode ? 0.5 : 1, // En debug se ve semitransparente para ajustar
                    borderColor: debugMode ? rgb(1, 0, 0) : undefined,
                    borderWidth: debugMode ? 1 : 0,
                });
             }

             // 2. Ayudas visuales (Modo Diseño)
             if (debugMode) {
                p.drawCircle({ x: fieldConfig.x, y: fieldConfig.y, size: 2, color: rgb(1, 0, 0) });
            }

            // 3. Escribir el nuevo texto encima del parche blanco
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