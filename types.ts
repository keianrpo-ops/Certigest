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
}

export interface CityTemplateConfig {
  // Ahora aceptamos un array de nombres de imagen para crear un PDF multipágina
  images: string[]; 
  fields: {
    [key in keyof CCCFormData]?: PdfFieldConfig;
  };
}