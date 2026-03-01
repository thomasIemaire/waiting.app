import { GFlowNode, NodeType } from '../core/gflow.types';
import { ensureAgentConfig } from './config-agent/config-agent';
import { ensureAgentGroupConfig } from './config-agent-group/config-agent-group';
import { ensureEditConfig } from './config-edit/config-edit';
import { ensureEndConfig } from './config-end/config-end';
import { ensureIfConfig } from './config-if/config-if';
import { ensureMergeConfig } from './config-merge/config-merge';
import { ensureSardineConfig } from './config-sardine/config-sardine';
import { ensureSwitchConfig } from './config-switch/config-switch.component';

type ConfigInitializer = (node: GFlowNode) => void;

const INITIALIZERS: Partial<Record<NodeType, ConfigInitializer>> = {
  agent: ensureAgentConfig,
  'agent-group': ensureAgentGroupConfig,
  edit: ensureEditConfig,
  end: ensureEndConfig,
  if: ensureIfConfig,
  merge: ensureMergeConfig,
  sardine: ensureSardineConfig,
  switch: ensureSwitchConfig,
};

export const initializeNodeConfig = (node: GFlowNode): void => {
  INITIALIZERS[node.type]?.(node);
};
