import { useState, useEffect } from 'react';
import axios from 'axios';
import { Lightbulb } from 'lucide-react';
import './App.css';

const HA_URL = import.meta.env.VITE_HA_URL;
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN;
const FLOORPLAN_BASE = `${HA_URL}/local/floorplan/teste`;

// API passa pelo proxy do Vite para evitar CORS
const haClient = axios.create({
  baseURL: '/api',
  headers: {
    Authorization: `Bearer ${HA_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

interface EntityState {
  entity_id: string;
  state: string;
  attributes: { friendly_name: string };
}

// Coordenadas extraídas do YAML original do Home Assistant (top%, left%)
const entities = [
  { id: 'switch.modulo_banheiro_bar_switch_1',               name: 'Banheiro Principal', top: 25, left: 23, overlay: 'bar-iluminacao-banheiro.png' },
  { id: 'switch.modulo_mini_ms_107_zigbee_1_canal_switch_1', name: 'Banheiro Secundário', top: 26, left: 27, overlay: 'bar-iluminacao-banheiro.png' },
  { id: 'switch.interruptor_espelho_bar_switch_1',           name: 'Espelho',          top: 22, left: 47, overlay: 'bar-espelho-ligado.png' },
  { id: 'switch.interruptor_balcao_bar_switch_1',            name: 'Balcão',           top: 50, left: 22, overlay: 'bar-iluminacao-cozinha.png' },
  { id: 'switch.interruptor_garagem_switch_3',               name: 'Garagem 3',        top: 52, left: 36, overlay: 'bar-iluminacao-tv-3.png' },
  { id: 'switch.interruptor_garagem_switch_2',               name: 'Garagem 2',        top: 55, left: 40, overlay: 'bar-iluminacao-tv-2.png' },
  { id: 'switch.interruptor_garagem_switch_1',               name: 'Garagem 1',        top: 60, left: 43, overlay: 'bar-iluminacao-tv-1.png' },
  { id: 'switch.interruptor_frente_bar_switch_2',            name: 'Frente 2',         top: 65, left: 50, overlay: 'bar-iluminacao-entrada.png' },
  { id: 'switch.interruptor_frente_bar_switch_1',            name: 'Frente 1',         top: 70, left: 54, overlay: 'bar-iluminacao-a-e.png' },
  { id: 'switch.interruptor_frente_bar_switch_3',            name: 'Frente 3',         top: 75, left: 58, overlay: 'bar-iluminacao-escada.png' },
];

// Ícones customizados (usam PNGs do HA)
const customEntities = [
  { id: 'switch.interruptor_churrasqueira_switch_2', name: 'Exaustor',   top: 38, left: 41, width: '4%', onIcon: 'icones/exaustor_on.png', offIcon: 'icones/exaustor_off.png' },
  { id: 'switch.interruptor_churrasqueira_switch_1', name: 'Chuveiro',   top: 15, left: 40, width: '4%', onIcon: 'icones/icon_banheiro_on.png', offIcon: 'icones/icon_banheiro_off.png' },
];

function App() {
  const [states, setStates] = useState<Record<string, string>>({});

  const fetchStates = async () => {
    try {
      const response = await haClient.get('/states');
      const newStates: Record<string, string> = {};
      response.data.forEach((entity: EntityState) => {
        newStates[entity.entity_id] = entity.state;
      });
      setStates(newStates);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  useEffect(() => {
    fetchStates();
    const interval = setInterval(fetchStates, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleSwitch = async (entityId: string, currentState: string) => {
    const service = currentState === 'on' ? 'turn_off' : 'turn_on';
    try {
      await haClient.post(`/services/switch/${service}`, { entity_id: entityId });
      setStates(prev => ({ ...prev, [entityId]: currentState === 'on' ? 'off' : 'on' }));
    } catch (error) {
      console.error('Error toggling switch:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="floorplan-section">
        {/* Logo no canto esquerdo (como no original) */}
        <div className="floating-logo">
          <img 
            src={`${FLOORPLAN_BASE}/logo_baragem.png`} 
            alt="Baragem Logo" 
          />
        </div>

        {/* Camada Base: Fundo (define o tamanho do container) */}
        <img 
          src={`${FLOORPLAN_BASE}/plano_de_fundo_baragem.png`} 
          alt="Bar Floorplan" 
          className="floorplan-image base"
        />
        
        {/* Camada 1: Tudo Desligado */}
        <img 
          src={`${FLOORPLAN_BASE}/bar-tudo-desligado.png`} 
          className="floorplan-image overlay"
          style={{ zIndex: 1 }}
        />

        {/* Camadas de Iluminação Dinâmica */}
        {entities.map(entity => {
          if (states[entity.id] === 'on' && entity.overlay) {
            return (
              <img 
                key={`overlay-${entity.id}`}
                src={`${FLOORPLAN_BASE}/${entity.overlay}`}
                className="floorplan-image dynamic-overlay"
                style={{ zIndex: 2, mixBlendMode: 'lighten' }}
              />
            );
          }
          return null;
        })}

        {/* Camada Interativa: Ícones Clicáveis */}
        <div className="floorplan-overlay">
          {/* Lâmpadas (ícone Lightbulb padrão) */}
          {entities.map((entity) => {
            const isActive = states[entity.id] === 'on';
            return (
              <div 
                key={entity.id} 
                className={`floorplan-marker ${isActive ? 'active' : ''}`}
                style={{ top: `${entity.top}%`, left: `${entity.left}%` }}
                onClick={() => toggleSwitch(entity.id, states[entity.id] || 'off')}
                title={entity.name}
              >
                <Lightbulb size={22} />
              </div>
            );
          })}

          {/* Ícones Customizados (Exaustor, Chuveiro) */}
          {customEntities.map((entity) => {
            const isActive = states[entity.id] === 'on';
            return (
              <img 
                key={entity.id}
                src={`${FLOORPLAN_BASE}/${isActive ? entity.onIcon : entity.offIcon}`}
                className="floorplan-marker custom"
                style={{ top: `${entity.top}%`, left: `${entity.left}%`, width: entity.width }}
                onClick={() => toggleSwitch(entity.id, states[entity.id] || 'off')}
                title={entity.name}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
