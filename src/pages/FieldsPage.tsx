import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  CheckCircle2,
  Database,
  Search,
  Filter,
  Code2,
} from 'lucide-react';
import { CustomFieldDefinition } from '../types/schema';

export const FieldsPage: React.FC = () => {
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states for new custom field
  const [fieldKey, setFieldKey] = useState('');
  const [displayLabel, setDisplayLabel] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Geral');
  const [dataType, setDataType] = useState<'string' | 'number' | 'boolean' | 'date' | 'url' | 'array'>('string');
  const [expectedSource, setExpectedSource] = useState('website_dom');
  const [cssSelector, setCssSelector] = useState('');

  const fetchFields = async () => {
    try {
      const res = await fetch('/api/fields');
      if (res.ok) {
        const data = await res.json();
        setCustomFields(data.custom_fields || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldKey || !displayLabel) return;

    try {
      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_key: fieldKey.trim().toLowerCase().replace(/\s+/g, '_'),
          display_label: displayLabel.trim(),
          description: description.trim(),
          category,
          data_type: dataType,
          expected_source: expectedSource,
          preferred_css_selector: cssSelector.trim(),
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setFieldKey('');
        setDisplayLabel('');
        setDescription('');
        setCssSelector('');
        fetchFields();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const masterCatalogGroups = [
    {
      group: '4.1 Identificação do Estabelecimento',
      fields: [
        { key: 'business_id', label: 'ID Interno Único', type: 'UUID/String', source: 'Engine', example: 'biz_1730000000_a1b2' },
        { key: 'business_name', label: 'Nome Comercial', type: 'String', source: 'Google Maps Places', example: 'Hospital Israelita Albert Einstein' },
        { key: 'legal_name', label: 'Razão Social Oficial', type: 'String', source: 'Receita Federal / CNPJ', example: 'SOCIEDADE BENEFICENTE ISRAELITA BRASILEIRA' },
        { key: 'primary_category', label: 'Categoria Principal', type: 'String', source: 'Google Maps Places', example: 'Hospital Geral' },
        { key: 'google_place_id', label: 'Place ID Google', type: 'String', source: 'Google Maps Places', example: 'ChIJ598l1EpeypQRh_88GjY52C8' },
        { key: 'listing_status', label: 'Status da Listagem', type: 'Enum', source: 'Google Maps Places', example: 'operational' },
      ],
    },
    {
      group: '4.2 Endereço & Localização Geográfica',
      fields: [
        { key: 'normalized_address', label: 'Endereço Normalizado', type: 'String', source: 'Normalizer', example: 'Av. Albert Einstein, 627 - Morumbi, São Paulo - SP' },
        { key: 'postal_code', label: 'Código Postal / CEP', type: 'String', source: 'Google Maps Places', example: '05652-900' },
        { key: 'coordinates', label: 'Latitude / Longitude', type: 'Float / Pair', source: 'Google Maps Places', example: '-23.5997, -46.7153' },
        { key: 'plus_code', label: 'Plus Code Global', type: 'String', source: 'Google Maps Places', example: '87G3C72M+3X' },
      ],
    },
    {
      group: '4.3 Contatos Comerciais',
      fields: [
        { key: 'primary_phone', label: 'Telefone Principal Formatado', type: 'String', source: 'Google Maps / Web', example: '(11) 2151-1233' },
        { key: 'phone_e164', label: 'Telefone Padrão E.164', type: 'String', source: 'Normalizer', example: '+551121511233' },
        { key: 'whatsapp_direct_link', label: 'Link Direto WhatsApp', type: 'URL', source: 'Website DOM', example: 'https://wa.me/551136202550' },
        { key: 'commercial_email', label: 'E-mail Comercial', type: 'Email', source: 'Website mailto', example: 'contato@einstein.br' },
      ],
    },
    {
      group: '4.4 Site & Presença Digital',
      fields: [
        { key: 'official_website', label: 'Site Oficial Certificado', type: 'URL', source: 'Google Maps / DOM', example: 'https://www.einstein.br' },
        { key: 'detected_cms', label: 'CMS / Plataforma Detectada', type: 'String', source: 'Web Inspector', example: 'WordPress VIP, VTEX, Next.js' },
        { key: 'schema_org_types', label: 'Tipos Schema.org / JSON-LD', type: 'Array', source: 'Cheerio DOM', example: '["Hospital", "LocalBusiness"]' },
      ],
    },
    {
      group: '4.12 Dados Empresariais / Receita Federal',
      fields: [
        { key: 'cnpj', label: 'CNPJ', type: 'String', source: 'Receita Federal', example: '60.765.823/0001-30' },
        { key: 'cnae_primary', label: 'CNAE Principal & Atividade', type: 'Object', source: 'Receita Federal', example: '86.10-1-01 - Atividades Hospitalares' },
        { key: 'registration_status', label: 'Situação Cadastral', type: 'Enum', source: 'Receita Federal', example: 'ATIVA' },
      ],
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Catálogo Mestre & Campos Extensíveis
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Especificação estável de todos os campos padronizados e cadastro dinâmico de atributos personalizados sem migração manual.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Campo Personalizado</span>
        </button>
      </div>

      {/* Custom Fields Section */}
      {customFields.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs p-5 space-y-4 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
              Campos Extensíveis Adicionados ({customFields.length})
            </h2>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Exportáveis em CSV e JSON</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customFields.map(cf => (
              <div key={cf.id} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{cf.display_label}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono border border-emerald-200 dark:border-emerald-800/40">
                    {cf.data_type}
                  </span>
                </div>
                <code className="text-slate-500 dark:text-slate-400 text-[11px] block">{cf.field_key}</code>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">{cf.description}</p>
                {cf.preferred_css_selector && (
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    CSS: {cf.preferred_css_selector}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Master Catalog Groups */}
      <div className="space-y-6">
        {masterCatalogGroups.map((grp, gIdx) => (
          <div key={gIdx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {grp.group}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-2.5 px-4">Identificador Estável</th>
                    <th className="py-2.5 px-4">Rótulo Exibido</th>
                    <th className="py-2.5 px-4">Tipo de Dado</th>
                    <th className="py-2.5 px-4">Fonte Mapeada</th>
                    <th className="py-2.5 px-4">Exemplo Observado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {grp.fields.map((f, fIdx) => (
                    <tr key={fIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900 dark:text-white">{f.key}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{f.label}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                          {f.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{f.source}</td>
                      <td className="py-2.5 px-4 text-emerald-800 dark:text-emerald-400 font-mono text-[11px] truncate max-w-xs">{f.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Modal to add custom field */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cadastrar Novo Campo Extensível
            </h3>
            <form onSubmit={handleCreateField} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Rótulo de Exibição *</label>
                <input
                  type="text"
                  value={displayLabel}
                  onChange={e => {
                    setDisplayLabel(e.target.value);
                    if (!fieldKey) {
                      setFieldKey(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                    }
                  }}
                  placeholder="Ex: Aceita Convênios de Saúde"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Chave snake_case do Campo *</label>
                <input
                  type="text"
                  value={fieldKey}
                  onChange={e => setFieldKey(e.target.value)}
                  placeholder="Ex: aceita_convenio_saude"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Tipo de Dado</label>
                  <select
                    value={dataType}
                    onChange={e => setDataType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="string">Texto (string)</option>
                    <option value="number">Numérico (number)</option>
                    <option value="boolean">Booleano (boolean)</option>
                    <option value="url">URL</option>
                    <option value="array">Lista (array)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Categoria</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Ex: Comodidades"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Descrição do Campo</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Para que serve este campo e como ele deve ser interpretado..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 h-20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Seletor CSS Preferencial (Opcional)</label>
                <input
                  type="text"
                  value={cssSelector}
                  onChange={e => setCssSelector(e.target.value)}
                  placeholder="Ex: .planos-aceitos, #convenios li"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer shadow-sm shadow-emerald-500/10"
                >
                  Salvar Campo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
