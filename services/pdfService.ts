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

    // 2. MAPEO DEL PDF (Solo coordenadas para parches blancos)
    // Ajustado para borrar la información de la columna derecha que aparecía en tu foto
    pdfMapping: {
      // --- ENCABEZADOS SUPERIORES ---
      fecha: { 
        x: 460, y: 718, isGlobal: true, 
        boxWidth: 140, boxHeight: 14 
      }, 
      recibo: { 
        x: 380, y: 703, isGlobal: true,
        boxWidth: 200, boxHeight: 14
      },
      codigoVerificacion: { 
        x: 420, y: 691, isGlobal: true,
        boxWidth: 150, boxHeight: 14
      },

      // --- SECCIÓN 1: NOMBRE, IDENTIFICACIÓN Y DOMICILIO ---
      // X ajustado a 215 para empezar justo después de los dos puntos ":"
      
      razonSocial: { 
        x: 215, y: 575, page: 0,
        boxWidth: 380, boxHeight: 15 // Tapa "INVERSIONES..."
      },
      
      nit: { 
        x: 215, y: 562, page: 0,
        boxWidth: 150, boxHeight: 12 // Tapa el número de NIT
      },
      
      ciudad: { 
        x: 215, y: 549, page: 0,
        boxWidth: 150, boxHeight: 12 // Tapa "CALI"
      },

      // --- SECCIÓN 2: MATRÍCULA ---
      
      matricula: { 
        x: 215, y: 495, page: 0,
        boxWidth: 100, boxHeight: 12 // Tapa "264544"
      },
      
      grupoNiif: { 
        x: 215, y: 469, page: 0,
        boxWidth: 150, boxHeight: 12 // Tapa "Grupo Grupo 3"
      },
      
      // --- SECCIÓN 3: UBICACIÓN ---
      
      domicilio: { 
        x: 215, y: 425, page: 0,
        boxWidth: 350, boxHeight: 12 // Tapa "AVENIDA 5 A..."
      },
      
      // Usamos el campo 'departamento' del form para tapar el campo "Municipio" del PDF si es necesario, 
      // o reutilizamos ciudad. En tu foto dice "Municipio: VALLE".
      departamento: {
         x: 215, y: 412, page: 0, 
         boxWidth: 150, boxHeight: 12 // Tapa "VALLE"
      },
       
      correo: {
        x: 215, y: 399, page: 0,
        boxWidth: 350, boxHeight: 12 // Tapa el correo largo
      },
      
      telefono: {
        x: 215, y: 386, page: 0,
        boxWidth: 150, boxHeight: 12 // Tapa el primer teléfono
      }
    }
  },
  
  'BOGOTA': {
    images: ['/templates/BOG1.jpg'], 
    formStructure: [], // Omitido por brevedad
    pdfMapping: {}
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

    // --- CARGAR PDF ---
    if (config.templatePath) {
        const fullUrl = getAssetUrl(config.templatePath);
        const existingPdfBytes = await fetch(fullUrl).then(res => {
            if (!res.ok) throw new Error(`No se encontró el PDF plantilla en: ${fullUrl}`);
            return res.arrayBuffer();
        });
        pdfDoc = await PDFDocument.load(existingPdfBytes);
    } else {
        throw new Error("Falta templatePath.");
    }
    
    const pages = pdfDoc.getPages();

    // --- SOLO DIBUJAR PARCHES BLANCOS ---
    Object.keys(config.pdfMapping).forEach((keyStr) => {
      const key = keyStr as keyof CCCFormData;
      const fieldConfig = config.pdfMapping[key];
      const value = data[key]; // Usamos el dato solo para saber si el campo está activo
      
      if (fieldConfig) { // Quitamos chequeo de 'value' para forzar que se dibujen todos los parches de prueba
        let targetPages: PDFPage[] = [];
        
        if (fieldConfig.isGlobal) {
            targetPages = pages;
        } else if (fieldConfig.page !== undefined && pages[fieldConfig.page]) {
            targetPages = [pages[fieldConfig.page]];
        }

        targetPages.forEach(p => {
             // DIBUJAR RECUADRO BLANCO (Tapa lo de abajo)
             if (fieldConfig.boxWidth && fieldConfig.boxHeight) {
                p.drawRectangle({
                    x: fieldConfig.x - 2, // Margen de seguridad
                    y: fieldConfig.y - 4, // Ajuste vertical
                    width: fieldConfig.boxWidth,
                    height: fieldConfig.boxHeight,
                    color: rgb(1, 1, 1), // BLANCO PURO
                    opacity: 1, // TOTALMENTE OPACO
                });
             }

             // --- TEXTO DESHABILITADO TEMPORALMENTE ---
             // Descomentar en el siguiente paso cuando los parches estén bien
             /*
             p.drawText(value.toString().toUpperCase(), {
                x: fieldConfig.x,
                y: fieldConfig.y,
                size: fieldConfig.size || 11,
                font: fontToUse,
                color: rgb(0.15, 0.15, 0.15),
            });
            */
        });
      }
    });

    const pdfBytes = await pdfDoc.save();
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PRUEBA_PARCHES_${data.ciudad}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Error generando PDF:", error);
  }
};