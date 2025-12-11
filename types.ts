export type ViewState = 'START' | 'CCC_FORM' | 'SANIDAD_FORM';
export type Country = 'COLOMBIA' | 'PERU' | 'ECUADOR' | null;

// Lista maestra de todos los posibles campos que la app soporta
export interface CCCFormData {
  razonSocial: string;
  nit: string;
  ciudad: string; // Domicilio principal (Municipio)
  representante: string;
  cedulaRep: string;
  fecha: string;
  matricula: string;
  grupoNiif: string;
  domicilio: string; // Dirección física
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
  font?: 'Helvetica' | 'Helvetica-Bold' | 'Courier'; 
  page?: number; 
  isGlobal?: boolean; 
  maxWidth?: number; 
  
  // Para borrar lo que hay debajo (Legacy/Optional now)
  boxWidth?: number;  
  boxHeight?: number; 
}

// DEFINICIÓN DEL FORMULARIO DINÁMICO
export interface FormFieldDef {
  key: keyof CCCFormData;
  label: string;
  type?: 'text' | 'date' | 'email' | 'number';
  placeholder?: string;
  required?: boolean;
  className?: string; // Para estilos extra (ej: font-mono para códigos)
}

export interface FormSection {
  title: string;
  icon?: string; // Nombre del icono para UI
  fields: FormFieldDef[];
}

export interface CityTemplateConfig {
  templatePath?: string;
  images?: string[]; 
  
  // Configuración VISUAL del Formulario (Qué campos mostrar y cómo agruparlos)
  formStructure: FormSection[];

  // Configuración TÉCNICA del PDF (Dónde pintar cada campo)
  // Ahora soporta array para repetir campos (ej: teléfonos)
  pdfMapping: {
    [key in keyof CCCFormData]?: PdfFieldConfig | PdfFieldConfig[];
  };
}