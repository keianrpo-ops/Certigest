import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { CCCFormData, CityTemplateConfig } from '../types';

/**
 * CONFIGURACIÓN DE PLANTILLAS POR CIUDAD
 * Aquí es donde definirás la ruta del PDF y las coordenadas (X, Y)
 * NOTA: En PDF-lib, (0,0) es la esquina INFERIOR izquierda.
 * Si usas un editor que te da Y desde arriba, usa: Y_pdf = Altura_Pagina - Y_editor
 */
const CITY_TEMPLATES: Record<string, CityTemplateConfig> = {
  'CALI': {
    url: '/templates/certificado_cali_base.pdf', // <--- COLOCA TU PDF AQUI
    fields: {
      razonSocial: { x: 150, y: 650, size: 10, font: 'Helvetica-Bold' },
      nit: { x: 150, y: 630, size: 10 },
      matricula: { x: 150, y: 610, size: 10 },
      fecha: { x: 150, y: 590, size: 10 },
      grupoNiif: { x: 150, y: 570, size: 10 },
      
      // Ubicación
      domicilio: { x: 150, y: 500, size: 10 }, // Ajusta estas coordenadas
      ciudad: { x: 150, y: 480, size: 10 },
      departamento: { x: 300, y: 480, size: 10 },
      correo: { x: 150, y: 460, size: 10 },
      telefono: { x: 150, y: 440, size: 10 },

      // Representación
      representante: { x: 150, y: 380, size: 10, font: 'Helvetica-Bold' },
      cedulaRep: { x: 150, y: 360, size: 10 }
    }
  },
  // Puedes agregar más ciudades aquí
  'BOGOTA': {
    url: '/templates/certificado_bogota_base.pdf',
    fields: {
      razonSocial: { x: 100, y: 700, size: 12 }
      // ... mapeo específico para Bogotá
    }
  }
};

export const generateCCCPdf = async (data: CCCFormData): Promise<void> => {
  // 1. Identificar la configuración basada en la ciudad
  // Normalizamos la ciudad para buscar en el config (ej: "Cali" -> "CALI")
  const cityKey = data.ciudad.toUpperCase().trim();
  const config = CITY_TEMPLATES[cityKey] || CITY_TEMPLATES['CALI']; // Fallback a Cali por defecto

  try {
    // 2. Cargar el PDF Base (Plantilla)
    // Esto hace una petición fetch al archivo en la carpeta public
    const existingPdfBytes = await fetch(config.url).then(res => {
      if (!res.ok) throw new Error(`No se encontró la plantilla en: ${config.url}`);
      return res.arrayBuffer();
    });

    // 3. Cargar el documento con pdf-lib
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Asumimos que escribimos en la primera página
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    // Obtener fuentes estándar
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 4. Estampar los datos según el mapa de coordenadas
    Object.entries(config.fields).forEach(([key, fieldConfig]) => {
      const value = data[key as keyof CCCFormData];
      
      if (value && fieldConfig) {
        firstPage.drawText(value.toString().toUpperCase(), {
          x: fieldConfig.x,
          y: fieldConfig.y,
          size: fieldConfig.size || 10,
          font: fieldConfig.font === 'Helvetica-Bold' ? helveticaBold : helvetica,
          color: rgb(0, 0, 0),
        });
      }
    });

    // 5. Guardar y Descargar
    const pdfBytes = await pdfDoc.save();
    
    // Crear blob y link de descarga
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Certificado_${data.ciudad}_${data.nit}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Error generando PDF:", error);
    // Si falla la carga (porque no tienes el archivo aún), creamos un PDF de error visual
    await createFallbackPdf(error instanceof Error ? error.message : String(error));
  }
};

// Función auxiliar para avisar si falta el archivo plantilla
const createFallbackPdf = async (errorMessage: string) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  page.drawText('ERROR: Plantilla no encontrada', { x: 50, y: 350, size: 20, font, color: rgb(1, 0, 0) });
  page.drawText('Por favor sube el archivo PDF a la carpeta publica.', { x: 50, y: 300, size: 14, font });
  page.drawText('Ruta esperada: ver consola o CITY_CONFIG', { x: 50, y: 280, size: 12, font });
  page.drawText(`Detalle: ${errorMessage}`, { x: 50, y: 250, size: 10, font });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'error_log.pdf';
  link.click();
};
