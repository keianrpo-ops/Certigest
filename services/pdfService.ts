import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import { CCCFormData, CityTemplateConfig } from '../types';

/**
 * CONFIGURACIÓN MAESTRA DE PLANTILLAS Y FORMULARIOS
 */
export const CITY_TEMPLATES: Record<string, CityTemplateConfig> = {
  'CALI': {
    templatePath: '/templates/plantilla_cali.pdf',
    
    // 1. DEFINICIÓN DEL FORMULARIO
    formStructure: [
      {
        title: "Códigos de Seguridad",
        fields: [
          { key: 'recibo', label: 'No. Recibo', className: 'font-mono text-yellow-200' },
          { key: 'codigoVerificacion', label: 'Cód. Verificación', className: 'font-mono text-yellow-200' },
          { key: 'fecha', label: 'Fecha Expedición', className: 'text-yellow-200' }
        ]
      },
      {
        title: "Identificación de la Empresa",
        fields: [
          { key: 'razonSocial', label: 'Razón Social (Nombre)', required: true },
          { key: 'nit', label: 'NIT', required: true },
          // Nota: La plantilla parece tener los campos en una sola columna vertical
        ]
      },
      {
        title: "Matrícula y Clasificación",
        fields: [
          { key: 'matricula', label: 'No. Matrícula' },
          { key: 'grupoNiif', label: 'Grupo NIIF (Ej: Grupo 3)' }
        ]
      },
      {
        title: "Ubicación Principal",
        fields: [
          { key: 'domicilio', label: 'Dirección Domicilio Principal' },
          { key: 'ciudad', label: 'Municipio' },
          { key: 'correo', label: 'Correo Electrónico', type: 'email' },
          { key: 'telefono', label: 'Teléfono Comercial' }
        ]
      }
    ],

    // 2. MAPEO DEL PDF (Coordenadas ajustadas a columna única alineada a la izquierda)
    // Fuente Courier tamaño 11 para coincidir con el original.
    pdfMapping: {
      // --- ENCABEZADOS SUPERIORES ---
      fecha: { 
        x: 460, y: 718, size: 10, isGlobal: true, font: 'Courier',
        boxWidth: 140, boxHeight: 14 
      }, 
      recibo: { 
        x: 380, y: 703, size: 10, font: 'Courier', isGlobal: true,
        boxWidth: 200, boxHeight: 14
      },
      codigoVerificacion: { 
        x: 420, y: 691, size: 10, font: 'Helvetica-Bold', isGlobal: true,
        boxWidth: 150, boxHeight: 14
      },

      // --- SECCIÓN 1: NOMBRE, IDENTIFICACIÓN Y DOMICILIO ---
      // Alineación X = 230 aprox (según captura, indentado respecto a etiquetas)
      
      razonSocial: { 
        x: 230, y: 575, size: 11, font: 'Courier', page: 0,
        boxWidth: 360, boxHeight: 16 // Alto aumentado para borrar bien
      },
      
      nit: { 
        x: 230, y: 562, size: 11, font: 'Courier', page: 0,
        boxWidth: 150, boxHeight: 16
      },
      
      // En la sección "Domicilio principal" (arriba) a veces solo va la ciudad
      ciudad: { 
        x: 230, y: 549, size: 11, font: 'Courier', page: 0,
        boxWidth: 150, boxHeight: 16
      },

      // --- SECCIÓN 2: MATRÍCULA ---
      // Está más abajo. Ajustamos Y. Alineación X igual a la de arriba.
      
      matricula: { 
        x: 230, y: 495, size: 11, font: 'Courier', page: 0,
        boxWidth: 100, boxHeight: 16
      },
      
      // Fecha matricula (hardcodeada o campo extra? Por ahora omitida en form, asumimos fija o manual)
      
      grupoNiif: { 
        x: 230, y: 469, size: 11, font: 'Courier', page: 0,
        boxWidth: 150, boxHeight: 16
      },
      
      // --- SECCIÓN 3: UBICACIÓN ---
      // Dirección del domicilio principal
      domicilio: { 
        x: 230, y: 425, size: 11, font: 'Courier', page: 0,
        boxWidth: 300, boxHeight: 16
      },
      
      // Municipio (debajo de dirección) - Reutilizamos 'ciudad' si es el mismo, 
      // pero si se necesita otro campo 'municipio', usaremos 'departamento' como comodín visual
      departamento: {
         x: 230, y: 412, size: 11, font: 'Courier', page: 0, 
         boxWidth: 150, boxHeight: 16
      },
       
      // Correo electrónico
      correo: {
        x: 230, y: 399, size: 11, font: 'Courier', page: 0,
        boxWidth: 300, boxHeight: 16
      },
      
      // Teléfono comercial 1
      telefono: {
        x: 230, y: 386, size: 11, font: 'Courier', page: 0,
        boxWidth: 150, boxHeight: 16
      }
    }
  },
  
  'BOGOTA': {
    images: ['/templates/BOG1.jpg'], 
    formStructure: [
       {
         title: "Datos Básicos",
         fields: [
            { key: 'razonSocial', label: 'Razón Social', required: true},
            { key: 'representante', label: 'Representante Legal', required: true},
            { key: 'cedulaRep', label: 'Cédula Rep. Legal'}
         ]
       }
    ],
    pdfMapping: {
      fecha: { x: 400, y: 750, size: 10, isGlobal: true },
      recibo: { x: 50, y: 750, size: 10, font: 'Courier', isGlobal: true },
      razonSocial: { x: 100, y: 650, size: 11, font: 'Helvetica-Bold', page: 0 },
      representante: { x: 100, y: 600, size: 10, page: 0 }
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
    Object.keys(config.pdfMapping).forEach((keyStr) => {
      const key = keyStr as keyof CCCFormData;
      const fieldConfig = config.pdfMapping[key];
      const value = data[key];
      
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
                    x: fieldConfig.x - 4, // Un poco más a la izquierda para asegurar el inicio
                    y: fieldConfig.y - 4, // Un poco más abajo para cubrir descuelgues
                    width: fieldConfig.boxWidth,
                    height: fieldConfig.boxHeight,
                    color: debugMode ? rgb(1, 0, 0) : rgb(1, 1, 1), 
                    opacity: debugMode ? 0.3 : 1, 
                    borderColor: debugMode ? rgb(1, 0, 0) : undefined,
                    borderWidth: debugMode ? 1 : 0,
                });
             }

             // 2. Ayudas visuales
             if (debugMode) {
                p.drawText(key, {x: fieldConfig.x, y: fieldConfig.y + 10, size: 5, font: helvetica, color: rgb(0,0,1)});
            }

            // 3. Escribir el nuevo texto
            p.drawText(value.toString().toUpperCase(), {
                x: fieldConfig.x,
                y: fieldConfig.y,
                size: fieldConfig.size || 11, // Default size aumentado a 11
                font: fontToUse,
                color: debugMode ? rgb(0, 0, 1) : rgb(0.15, 0.15, 0.15),
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
    const color = rgb(0.5, 0.5, 0.5); 

    for (let x = 0; x <= width; x += step) {
        page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, thickness: 0.5, color, opacity: 0.2 });
        if (x % 100 === 0) page.drawText(x.toString(), { x: x + 2, y: 10, size: fontSize, font, color });
    }
    for (let y = 0; y <= height; y += step) {
        page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: 0.5, color, opacity: 0.2 });
        if (y % 100 === 0) page.drawText(y.toString(), { x: 5, y: y + 2, size: fontSize, font, color });
    }
    
    page.drawText(`PAGINA ${pageNum}`, { x: 20, y: height - 20, size: 12, font, color: rgb(1,0,0) });
};