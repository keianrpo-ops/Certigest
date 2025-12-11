import React, { useState } from 'react';
import { CCCFormData } from '../types';
import Button from './Button';
import Input from './Input';
import { generateCCCPdf } from '../services/pdfService';
import { Save, X, RotateCcw, Loader2, Grid3X3, Wand2 } from 'lucide-react';

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
  // Usamos una fecha con formato completo incluyendo hora para el PDF
  fecha: new Date().toLocaleString('es-CO'), 
  matricula: '882211',
  grupoNiif: 'GRUPO 3',
  domicilio: 'CARRERA 24 B 51 70',
  departamento: 'VALLE',
  correo: 'contingencia@proton.me',
  telefono: '3151564001',
  recibo: '',
  codigoVerificacion: ''
};

const CCCForm: React.FC<Props> = ({ onCancel, onLog }) => {
  const [formData, setFormData] = useState<CCCFormData>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Generar códigos aleatorios al montar si están vacíos
  React.useEffect(() => {
    if (!formData.recibo) generateSecurityCodes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateSecurityCodes = () => {
    // Generar Recibo (Ej: 8502502)
    const randomRecibo = Math.floor(Math.random() * (9999999 - 1000000) + 1000000).toString();
    
    // Generar Código de Verificación (Ej: 0822NXIH99)
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomCode = '';
    for (let i = 0; i < 10; i++) {
        randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setFormData(prev => ({
        ...prev,
        recibo: randomRecibo,
        codigoVerificacion: randomCode,
        fecha: new Date().toLocaleString('es-CO', { 
            year: 'numeric', month: '2-digit', day: '2-digit', 
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: true
        }).replace(',', '')
    }));
    onLog('Nuevos códigos de seguridad generados.');
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
    generateSecurityCodes();
    onLog('Formulario limpiado (códigos regenerados).');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    onLog(`Generando certificado multipágina para: ${formData.ciudad}...`);
    
    try {
      await generateCCCPdf(formData, debugMode);
      onLog('PDF generado y descargado.');
    } catch (error) {
      console.error(error);
      onLog('Error crítico generando el PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Generador por Imágenes</h2>
          <p className="text-slate-400 text-sm">
            Sube tus imágenes JPG a <code className="bg-slate-800 px-1 rounded text-xs text-cyan-400">/public/templates/</code>
          </p>
        </div>
        
        {/* Toggle Modo Diseño */}
        <button 
            type="button"
            onClick={() => setDebugMode(!debugMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                debugMode 
                ? 'bg-purple-900/50 border-purple-500 text-purple-300' 
                : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
        >
            <Grid3X3 size={14} />
            {debugMode ? 'MODO DISEÑO ACTIVADO' : 'Activar Modo Diseño'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-8">
        
        {/* Section: Seguridad (Automática) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gradient-to-r from-yellow-500/20 to-transparent p-3 rounded-lg border-l-2 border-yellow-500">
            <h3 className="text-yellow-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <Wand2 size={16} />
                Códigos de Seguridad (Únicos)
            </h3>
            <button 
                type="button" 
                onClick={generateSecurityCodes}
                className="text-xs text-yellow-300 hover:text-white underline"
            >
                Regenerar Códigos
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="recibo" label="No. Recibo (Auto)" value={formData.recibo} onChange={handleChange} required className="border-yellow-500/30 text-yellow-100 font-mono" />
            <Input name="codigoVerificacion" label="Cód. Verificación (Auto)" value={formData.codigoVerificacion} onChange={handleChange} required className="border-yellow-500/30 text-yellow-100 font-mono" />
            <Input name="fecha" label="Fecha y Hora Emisión" value={formData.fecha} onChange={handleChange} required className="border-yellow-500/30 text-yellow-100" />
          </div>
        </div>

        {/* Section 1 */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-cyan-500/20 to-transparent p-3 rounded-lg border-l-2 border-cyan-500">
            <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">1. Datos de Identificación</h3>
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
            <Input name="ciudad" label="Ciudad" placeholder="Ej: CALI" value={formData.ciudad} onChange={handleChange} />
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
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col md:flex-row justify-between gap-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={handleReset} className="text-slate-500 hover:text-white" disabled={isGenerating}>
            <RotateCcw size={16} />
            Limpiar Todo
          </Button>
          
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isGenerating}>
              <X size={18} />
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isGenerating}>
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isGenerating ? 'Generando Documento...' : 'Generar PDF'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CCCForm;