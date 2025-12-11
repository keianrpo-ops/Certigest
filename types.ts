export type ViewState = 'START' | 'CCC_FORM' | 'SANIDAD_FORM';
export type Country = 'COLOMBIA' | 'PERU' | 'ECUADOR' | null;

export interface CCCFormData {
  razonSocial: string;
  nit: string;
  ciudad: string;
  representante: string;
  cedulaRep: string;
  fecha: string;
  matricula: string;
  grupoNiif: string;
  domicilio: string;
  departamento: string;
  correo: string;
  telefono: string;
  // Campos únicos de seguridad
  recibo: string;
  codigoVerificacion: string;
}

export interface LogEntry {
  id: string;
  message: string;
  timestamp: string;
}

// Configuración para el mapeo de PDFs
export interface PdfFieldConfig {
  x: number;
  y: number;
  size?: number;
  font?: 'Helvetica' | 'Helvetica-Bold' | 'Courier'; // Courier es bueno para códigos
  page?: number; // 0 based index (0 = pagina 1, 1 = pagina 2, etc.)
  isGlobal?: boolean; // Si true, se imprime en todas las páginas (ej: encabezados)
  maxWidth?: number; // Para ajustar texto largo si es necesario
  
  // PROPIEDADES NUEVAS PARA "BORRAR" LO QUE HAY DEBAJO
  boxWidth?: number;  // Ancho del parche blanco
  boxHeight?: number; // Alto del parche blanco
}

export interface CityTemplateConfig {
  // Opción A: Usar un PDF existente como base (MEJOR CALIDAD)
  templatePath?: string;
  // Opción B: Usar imágenes (LEGADO)
  images?: string[]; 
  
  fields: {
    [key in keyof CCCFormData]?: PdfFieldConfig;
  };
}