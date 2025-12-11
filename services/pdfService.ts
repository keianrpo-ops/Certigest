import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import { CCCFormData, CityTemplateConfig, PdfFieldConfig } from '../types';

/**
 * CONFIGURACIÓN MAESTRA DE PLANTILLAS Y FORMULARIOS
 */
export const CITY_TEMPLATES: Record<string, CityTemplateConfig> = {
  'CALI': {
    templatePath: '/templates/plantilla_cali.pdf',
    
    // 1. DEFINICIÓN DEL FORMULARIO (Lo que ve el usuario)
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

    // 2. MAPEO DEL PDF (AQUÍ ES DONDE AJUSTAS LAS POSICIONES)
    // ---------------------------------------------------------
    // GUÍA RÁPIDA:
    // x: Número más grande = Mover a la DERECHA
    // y: Número más grande = Mover hacia ARRIBA
    // ---------------------------------------------------------
    pdfMapping: {
      
      // --- ENCABEZADOS SUPERIORES ---
      fecha: { 
        x: 120, // Derecha
        y: 710, // Altura
        size: 9 
      }, 
      recibo: { x: 380, y: 680, size: 9 },
      codigoVerificacion: { x: 420, y: 668, size: 9 },

      // --- SECCIÓN 1: NOMBRE, IDENTIFICACIÓN ---
      razonSocial: { 
        x: 215, 
        y: 486, // Si está muy alto, baja este número a 490 o 488
        size: 9, 
        font: 'Courier-Bold' 
      },
      
      nit: { x: 215, y: 480, size: 9 },
      
      ciudad: { x: 215, y: 468, size: 9 }, // Municipio principal

      // --- SECCIÓN 2: MATRÍCULA ---
      matricula: { x: 215, y: 424, size: 9 },
      
      grupoNiif: { x: 215, y: 400, size: 9 },
      
      // --- SECCIÓN 3: UBICACIÓN COMERCIAL ---
      // (Se imprime en dos lugares: Comercial y Judicial)
      domicilio: [
        { x: 215, y: 357, size: 9 }, // Dirección Comercial (Arriba)
        { x: 215, y: 265, size: 9 }  // Dirección Judicial (Abajo)
      ],
      
      departamento: [
        { x: 215, y: 345, size: 9 }, // Dept. Comercial
        { x: 215, y: 253, size: 9 }  // Dept. Judicial
      ],
       
      correo: [
        { x: 215, y: 333, size: 9 }, // Email Comercial
        { x: 215, y: 241, size: 9 }  // Email Judicial
      ],
      
      // --- TELÉFONOS (Se repiten 6 veces) ---
      telefono: [
        // Bloque Comercial
        { x: 215, y: 321, size: 9 }, 
        { x: 215, y: 309, size: 9 },
        { x: 215, y: 297, size: 9 },
        // Bloque Judicial
        { x: 215, y: 229, size: 9 },
        { x: 215, y: 217, size: 9 },
        { x: 215, y: 205, size: 9 }
      ]
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
    
    // Cargar fuentes COURIER (Tipo máquina de escribir)
    const courier = await pdfDoc.embedFont(StandardFonts.Courier);
    const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

    const pages = pdfDoc.getPages();

    // Función auxiliar para dibujar texto
    const drawField = (text: string, cfg: PdfFieldConfig) => {
        // Por defecto Courier
        let font = courier;
        
        // Si la config pide Bold, usamos Courier Bold
        if (cfg.font === 'Courier-Bold') {
            font = courierBold;
        }

        // Seleccionar página
        const pageIndex = cfg.page || 0;
        if (pageIndex >= pages.length) return;
        const page = pages[pageIndex];

        // Dibujar texto (siempre negro)
        page.drawText(text, {
            x: cfg.x,
            y: cfg.y,
            size: cfg.size || 10,
            font: font,
            color: rgb(0, 0, 0),
        });

        // Debug visual: Rectángulo ROJO semi-transparente
        if (debugMode) {
             const estimatedWidth = (cfg.size || 10) * text.length * 0.6;
             const estimatedHeight = (cfg.size || 10) + 4;
             
             page.drawRectangle({
                x: cfg.x - 2,
                y: cfg.y - 2,
                width: estimatedWidth,
                height: estimatedHeight,
                borderColor: rgb(1, 0, 0), // Borde Rojo
                borderWidth: 1,
                color: rgb(1, 0, 0),       // Relleno Rojo
                opacity: 0.5               // 50% Transparente
             });
        }
    };

    // Iterar sobre el mapeo y dibujar
    Object.keys(config.pdfMapping).forEach((keyStr) => {
      const key = keyStr as keyof CCCFormData;
      const mapping = config.pdfMapping[key];
      const value = data[key];

      if (mapping && value) {
        if (Array.isArray(mapping)) {
            mapping.forEach(cfg => drawField(value, cfg));
        } else {
            drawField(value, mapping);
        }
      }
    });

    const pdfBytes = await pdfDoc.save();
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    // Cambiar nombre si es debug
    link.download = debugMode 
        ? `DEBUG_${data.ciudad}_${data.nit}.pdf`
        : `CERTIFICADO_${data.ciudad}_${data.nit}.pdf`;
        
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Error generando PDF:", error);
  }
};