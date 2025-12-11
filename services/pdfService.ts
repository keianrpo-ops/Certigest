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
          { key: 'grupoNiif', label: 'Grupo NIIF' }
        ]
      },
      {
        title: "Ubicación Principal",
        fields: [
          { key: 'domicilio', label: 'Dirección Domicilio' },
          { key: 'ciudad', label: 'Municipio' },
          { key: 'correo', label: 'Correo Electrónico', type: 'email' },
          { key: 'telefono', label: 'Teléfono Comercial' }
        ]
      }
    ],

    // 2. MAPEO DEL PDF (Coordenadas ajustadas para coincidir con la imagen)
    pdfMapping: {
      // --- ENCABEZADOS SUPERIORES ---
      // Estos parecían estar mas o menos bien ubicados en la zona superior
      fecha: { 
        x: 460, y: 718, isGlobal: true, 
        boxWidth: 140, boxHeight: 14 
      }, 
      recibo: { 
        x: 380, y: 708, isGlobal: true, // Ajustado ligeramente arriba
        boxWidth: 200, boxHeight: 14
      },
      codigoVerificacion: { 
        x: 420, y: 696, isGlobal: true, // Ajustado ligeramente arriba
        boxWidth: 150, boxHeight: 14
      },

      // --- SECCIÓN 1: NOMBRE, IDENTIFICACIÓN Y DOMICILIO ---
      // Bajamos de ~575 a ~525 para coincidir con la posición real
      
      razonSocial: { 
        x: 215, y: 525, page: 0,
        boxWidth: 380, boxHeight: 14 // Tapa "INVERSIONES..."
      },
      
      nit: { 
        x: 215, y: 513, page: 0,
        boxWidth: 150, boxHeight: 12 // Tapa "890..."
      },
      
      ciudad: { 
        x: 215, y: 501, page: 0,
        boxWidth: 150, boxHeight: 12 // Tapa "CALI" (Domicilio principal)
      },

      // --- SECCIÓN 2: MATRÍCULA ---
      // Bajamos de ~495 a ~460
      
      matricula: { 
        x: 215, y: 460, page: 0,
        boxWidth: 100, boxHeight: 12 // Tapa "264544"
      },
      
      // La fecha de matrícula original está en Y ~448 (no la mapeamos aún pero calculamos el espacio)
      
      grupoNiif: { 
        x: 215, y: 436, page: 0,
        boxWidth: 150, boxHeight: 12 // Tapa "Grupo Grupo 3"
      },
      
      // --- SECCIÓN 3: UBICACIÓN ---
      // Bajamos de ~425 a ~395
      
      domicilio: { 
        x: 215, y: 395, page: 0,
        boxWidth: 350, boxHeight: 12 // Tapa "AVENIDA 5 A..."
      },
      
      // Usamos 'departamento' para borrar el municipio en esta sección si es diferente
      departamento: {
         x: 215, y: 383, page: 0, 
         boxWidth: 150, boxHeight: 12 // Tapa "VALLE"
      },
       
      correo: {
        x: 215, y: 371, page: 0,
        boxWidth: 350, boxHeight: 12 // Tapa "contingencia..."
      },
      
      telefono: {
        x: 215, y: 359, page: 0,
        boxWidth: 150, boxHeight: 12 // Tapa el primer teléfono
      }
      
      // NOTA: Los teléfonos 2 y 3 y la sección judicial siguen visibles porque 
      // no tenemos campos en el formulario para ellos aún.
    }
  },
  
  'BOGOTA': {
    images: ['/templates/BOG1.jpg'], 
    formStructure: [], 
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
      
      if (fieldConfig) {
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
                    x: fieldConfig.x - 2, 
                    y: fieldConfig.y - 4, // Ajuste fino para centrar verticalmente sobre texto
                    width: fieldConfig.boxWidth,
                    height: fieldConfig.boxHeight + 4, // Un poco más alto para asegurar cobertura
                    color: rgb(1, 1, 1), // BLANCO PURO
                    opacity: 1, 
                });
             }
        });
      }
    });

    const pdfBytes = await pdfDoc.save();
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PRUEBA_PARCHES_V2_${data.ciudad}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Error generando PDF:", error);
  }
};