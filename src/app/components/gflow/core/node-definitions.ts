import { ConfigAgentGroup, createAgentGroupConfig } from '../configs/config-agent-group/config-agent-group';
import {
  ConfigAgent,
  createAgentConfig,
  createAgentOutputPorts,
} from '../configs/config-agent/config-agent';
import { ConfigEdit, createEditConfig } from '../configs/config-edit/config-edit';
import { ConfigEnd, createEndConfig } from '../configs/config-end/config-end';
import { ConfigIf, createIfConfig } from '../configs/config-if/config-if';
import { ConfigMerge, createMergeConfig } from '../configs/config-merge/config-merge';
import { ConfigSardine, createSardineConfig } from '../configs/config-sardine/config-sardine';
import { ConfigSwitchComponent, createSwitchConfig } from '../configs/config-switch/config-switch.component';
import { GFlowPort, JsonValue, NodeType } from './gflow.types';

const cloneJson = <T extends JsonValue>(value: T): T =>
  JSON.parse(JSON.stringify(value));

const clonePorts = (ports?: GFlowPort[]): GFlowPort[] =>
  (ports ?? []).map((port) => ({
    ...port,
    map: port.map === undefined ? undefined : cloneJson(port.map),
  }));

export type NodeCategory = 'Flux' | 'Logique' | 'Agents';

interface NodeBlueprint {
  name: string;
  inputs?: GFlowPort[];
  outputs?: GFlowPort[];
  entries?: GFlowPort[];
  exits?: GFlowPort[];
  configured?: boolean;
  config?: unknown;
  configComponent?: any;
}

export interface NodeTypeDefinition {
  type: NodeType;
  label: string;
  icon: { icon: string; rotate?: number };
  color?: string;
  category: NodeCategory;
  create: () => NodeBlueprint;
}

export interface PaletteItem {
  type: NodeType;
  label: string;
  icon: { icon: string; rotate?: number };
  color?: string;
}

export interface PaletteGroup {
  name: string;
  items: PaletteItem[];
}

const definitions: NodeTypeDefinition[] = [
  {
    type: 'new',
    label: 'Nouveau',
    icon: { icon: 'fa-solid fa-plus' },
    color: 'var(--background-color-300)',
    category: 'Flux',
    create: () => ({
      name: 'Nouveau',
      inputs: clonePorts([{}]),
      outputs: clonePorts([{}]),
      entries: clonePorts([{}]),
      exits: clonePorts([{}]),
    }),
  },
  {
    type: 'start',
    label: 'Début',
    icon: { icon: 'fa-solid fa-play' },
    color: '#DEF5EE',
    category: 'Flux',
    create: () => ({
      name: 'Début',
      inputs: [],
      outputs: clonePorts([{}]),
    }),
  },
  {
    type: 'end',
    label: 'Fin',
    icon: { icon: 'fa-solid fa-stop' },
    color: '#FADCD9',
    category: 'Flux',
    create: () => ({
      name: 'Fin',
      inputs: clonePorts([{}]),
      outputs: [],
      configured: false,
      config: createEndConfig(),
      configComponent: ConfigEnd,
    }),
  },
  {
    type: 'if',
    label: 'Si / Sinon',
    icon: {
      icon: 'fa-solid fa-arrows-split-up-and-left',
      rotate: 90,
    },
    color: '#FFF3B0',
    category: 'Logique',
    create: () => ({
      name: 'Si / Sinon',
      inputs: clonePorts([{}]),
      outputs: clonePorts([{ name: 'true' }, { name: 'false' }]),
      configured: false,
      config: createIfConfig(),
      configComponent: ConfigIf,
    }),
  },
  {
    type: 'switch',
    label: 'Switch / Case',
    icon: { icon: 'fa-solid fa-shuffle' },
    color: '#FFF3B0',
    category: 'Logique',
    create: () => ({
      name: 'Switch / Case',
      inputs: clonePorts([{}]),
      outputs: clonePorts([{ name: 'Case 1' }]),
      configured: false,
      config: createSwitchConfig(),
      configComponent: ConfigSwitchComponent,
    }),
  },
  {
    type: 'merge',
    label: 'Fusionner',
    icon: { icon: 'fa-solid fa-code-fork' },
    color: '#FFF3B0',
    category: 'Logique',
    create: () => ({
      name: 'Fusionner',
      inputs: clonePorts([{}]),
      outputs: clonePorts([{}]),
      configured: false,
      config: createMergeConfig(),
      configComponent: ConfigMerge,
    }),
  },
  {
    type: 'edit',
    label: 'Modifier',
    icon: { icon: 'fa-solid fa-pen' },
    color: '#FFF3B0',
    category: 'Logique',
    create: () => ({
      name: 'Modifier',
      inputs: clonePorts([{}]),
      outputs: clonePorts([{ map: {} }]),
      configured: false,
      config: createEditConfig(),
      configComponent: ConfigEdit,
    }),
  },
  {
    type: 'sardine',
    label: 'Sardine',
    icon: { icon: 'fa-solid fa-fish' },
    color: '#DEF5EE',
    category: 'Agents',
    create: () => ({
      name: 'Sardine',
      inputs: clonePorts([{}]),
      outputs: clonePorts([
        { name: 'valide' },
        { name: 'invalide' },
      ]),
      configured: false,
      config: createSardineConfig(),
      configComponent: ConfigSardine,
    }),
  },
  {
    type: 'agent',
    label: 'Agent',
    icon: { icon: 'fa-solid fa-location-arrow' },
    color: '#DEF5EE',
    category: 'Agents',
    create: () => ({
      name: 'Agent',
      inputs: clonePorts([{}]),
      outputs: clonePorts(createAgentOutputPorts()),
      exits: clonePorts([{}]),
      configured: false,
      config: createAgentConfig(),
      configComponent: ConfigAgent,
    }),
  },
  {
    type: 'agent-group',
    label: 'Agent groupé',
    icon: { icon: 'fa-solid fa-users' },
    color: '#DEF5EE',
    category: 'Agents',
    create: () => ({
      name: 'Agent groupé',
      inputs: clonePorts([{}]),
      outputs: clonePorts([{}]),
      entries: clonePorts([{}, {}]),
      configured: false,
      config: createAgentGroupConfig(),
      configComponent: ConfigAgentGroup,
    }),
  },
];

export const NODE_DEFINITIONS = definitions;

export const NODE_DEFINITION_MAP: Record<NodeType, NodeTypeDefinition> = definitions
  .reduce((acc, definition) => {
    acc[definition.type] = definition;
    return acc;
  }, {} as Record<NodeType, NodeTypeDefinition>);

export const PALETTE_GROUPS: PaletteGroup[] = (() => {
  const groups = new Map<NodeCategory, PaletteGroup>();

  definitions.forEach((definition) => {
    if (definition.type === 'new') return;

    const existing = groups.get(definition.category);
    const item: PaletteItem = {
      type: definition.type,
      label: definition.label,
      icon: definition.icon,
      color: definition.color,
    };

    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(definition.category, {
        name: definition.category,
        items: [item],
      });
    }
  });

  const order: NodeCategory[] = ['Core' as any, 'Tools' as any, 'Logic' as any, 'Data' as any, 'Agents'];

  return Array.from(groups.values());
})();

