import React, { useState, useEffect, useMemo } from 'react';
import { CCCFormData } from '../types';
import Button from './Button';
import Input from './Input';
import { generateCCCPdf, getAvailableCities, CITY_TEMPLATES } from '../services/pdfService';
import { Save, X, RotateCcw, Loader2, Grid3X3, Wand2, Building2 } from 'lucide-react';

interface Props {
  onCancel: () => void;
  onLog: (msg: string) => void;
}

const initialData: CCCFormData = {
  razonSocial: 'CALI VOLQUETAS DEL VALLE S.A.S',
  nit: '900658287-6',
  ciudad: 'CALI', 
  representante: '',
  cedulaRep: '',
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

  // Obtener ciudades disponibles
  const availableCities = getAvailableCities();

  // Obtener la configuración de la ciudad actual para renderizar el formulario
  const currentCityConfig = useMemo(() => {
    return CITY_TEMPLATES[formData.ciudad] || CITY_TEMPLATES['CALI'];
  }, [formData.ciudad]);

  useEffect(() => {
    if (!formData.recibo) generateSecurityCodes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateSecurityCodes = () => {
    const randomRecibo = Math.floor(Math.random() * (9999999 - 1000000) + 1000000).toString();
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
    // Resetear manteniendo la ciudad
    const currentCity = formData.ciudad;
    setFormData({ ...initialData, ciudad: currentCity });
    generateSecurityCodes();
    onLog('Formulario limpiado.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    onLog(`Generando certificado para: ${formData.ciudad}...`);
    
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
          <h2 className="text-2xl font-bold text-white mb-2">Generador de Cámara de Comercio</h2>
          <p className="text-slate-400 text-sm">
            Plantilla activa: <span className="text-cyan-400 font-bold">{formData.ciudad}</span>
          </p>
        </div>
        
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
        
        {/* Selector de Ciudad (Plantilla) */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
                <Building2 className="text-cyan-400" size={20} />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Seleccionar Plantilla de Ciudad</h3>
            </div>
            <div className="relative">
                <select
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 appearance-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all cursor-pointer font-bold"
                >
                    {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
                El formulario cambiará automáticamente según la ciudad seleccionada.
            </p>
        </div>

        {/* Sección de seguridad global (botones) */}
        <div className="flex justify-end">
            <button 
                type="button" 
                onClick={generateSecurityCodes}
                className="text-xs text-yellow-500 hover:text-yellow-300 underline flex items-center gap-1"
            >
                <Wand2 size={12} /> Regenerar Códigos de Seguridad
            </button>
        </div>

        {/* Renderizado Dinámico de Secciones */}
        {currentCityConfig.formStructure.map((section, idx) => (
            <div key={idx} className="space-y-4 animate-fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="bg-gradient-to-r from-cyan-500/10 to-transparent p-2 rounded-lg border-l-2 border-cyan-500">
                    <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">
                        {idx + 1}. {section.title}
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.fields.map((field) => (
                        <Input
                            key={field.key}
                            name={field.key}
                            label={field.label}
                            value={formData[field.key] || ''}
                            onChange={handleChange}
                            type={field.type || 'text'}
                            required={field.required}
                            className={field.className}
                            placeholder={field.placeholder}
                        />
                    ))}
                </div>
            </div>
        ))}

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