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
  font?: 'Helvetica' | 'Helvetica-Bold';
}

export interface CityTemplateConfig {
  url: string; // Ruta al archivo PDF base (ej: /templates/cali.pdf)
  fields: {
    [key in keyof CCCFormData]?: PdfFieldConfig;
  };
}
