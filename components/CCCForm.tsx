import React, { useState } from 'react';
import { CCCFormData } from '../types';
import Button from './Button';
import Input from './Input';
import { generateCCCPdf } from '../services/pdfService';
import { FileText, Save, X, RotateCcw, Loader2 } from 'lucide-react';

interface Props {
  onCancel: () => void;
  onLog: (msg: string) => void;
}

const initialData: CCCFormData = {
  razonSocial: 'CALI VOLQUETAS DEL VALLE S.A.S',
  nit: '900658287-6',
  ciudad: 'CALI',
  representante: 'RODRIGO CANO',
  cedulaRep: '19055229',
  fecha: new Date().toISOString().split('T')[0],
  matricula: '882211',
  grupoNiif: 'GRUPO 3',
  domicilio: 'CARRERA 24 B 51 70',
  departamento: 'VALLE',
  correo: 'contingencia@proton.me',
  telefono: '3151564001',
};

const CCCForm: React.FC<Props> = ({ onCancel, onLog }) => {
  const [formData, setFormData] = useState<CCCFormData>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
        ...initialData,
        razonSocial: '',
        nit: '',
        ciudad: '',
        representante: '',
        cedulaRep: '',
        matricula: '',
        grupoNiif: '',
        domicilio: '',
        departamento: '',
        correo: '',
        telefono: ''
    });
    onLog('Formulario limpiado.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    onLog(`Iniciando mapeo de PDF para ciudad: ${formData.ciudad}...`);
    
    try {
      await generateCCCPdf(formData);
      onLog('PDF generado sobre plantilla exitosamente.');
    } catch (error) {
      console.error(error);
      onLog('Error al procesar la plantilla PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Generador por Plantilla</h2>
          <p className="text-slate-400 text-sm">
            Los datos se estamparán sobre el PDF base configurado para <span className="text-cyan-400 font-bold">{formData.ciudad || '...'}</span>.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-8">
        
        {/* Section 1 */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-cyan-500/20 to-transparent p-3 rounded-lg border-l-2 border-cyan-500">
            <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">1. Datos de Identificación (Mapping)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="razonSocial" label="Razón Social" placeholder="Ej: CALI VOLQUETAS..." value={formData.razonSocial} onChange={handleChange} required />
            <Input name="nit" label="NIT" placeholder="Ej: 900..." value={formData.nit} onChange={handleChange} required />
            <Input name="matricula" label="Nro Matrícula" placeholder="Ej: 882211" value={formData.matricula} onChange={handleChange} />
            <Input name="grupoNiif" label="Grupo NIIF" placeholder="Ej: GRUPO 3" value={formData.grupoNiif} onChange={handleChange} />
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-cyan-500/20 to-transparent p-3 rounded-lg border-l-2 border-cyan-500">
            <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">2. Datos de Ubicación</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="ciudad" label="Ciudad (Define la plantilla)" placeholder="Ej: CALI" value={formData.ciudad} onChange={handleChange} />
            <Input name="departamento" label="Departamento" placeholder="Ej: VALLE" value={formData.departamento} onChange={handleChange} />
            <Input name="domicilio" label="Dirección Principal" placeholder="Ej: CRA 10 #..." value={formData.domicilio} onChange={handleChange} />
            <Input name="correo" type="email" label="Correo Electrónico" value={formData.correo} onChange={handleChange} />
            <Input name="telefono" label="Teléfono" value={formData.telefono} onChange={handleChange} />
          </div>
        </div>

         {/* Section 3 */}
         <div className="space-y-4">
          <div className="bg-gradient-to-r from-cyan-500/20 to-transparent p-3 rounded-lg border-l-2 border-cyan-500">
            <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">3. Representación Legal</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="representante" label="Representante Legal" placeholder="Nombre Completo" value={formData.representante} onChange={handleChange} required />
            <Input name="cedulaRep" label="Identificación" placeholder="Cédula" value={formData.cedulaRep} onChange={handleChange} required />
            <Input name="fecha" type="date" label="Fecha Renovación" value={formData.fecha} onChange={handleChange} />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col md:flex-row justify-between gap-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={handleReset} className="text-slate-500 hover:text-white" disabled={isGenerating}>
            <RotateCcw size={16} />
            Limpiar Datos
          </Button>
          
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isGenerating}>
              <X size={18} />
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isGenerating}>
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isGenerating ? 'Mapeando...' : 'Generar PDF'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CCCForm;
