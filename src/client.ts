import {
  NoxAeApiClient,
  NoxAeApiNetworkHubClient,
} from "@wumx-labs/noxaeapi-sdk";
import { resolveConfig, type ResolvedConfig } from "./config.js";

export interface NoxAeSession {
  config: ResolvedConfig;
  hubClient: NoxAeApiNetworkHubClient | null;
  singleClient: NoxAeApiClient | null;
  isHub: boolean;
  getClient(nodeId?: string): any;
  getDefaultNodeId(): Promise<string | undefined>;
  resolveTargetClient(nodeId?: string): Promise<{ client: any; effectiveNodeId?: string }>;
}

let activeSession: NoxAeSession | null = null;
let cachedDefaultNode: { id: string; expires: number } | null = null;

export function getSession(): NoxAeSession {
  if (activeSession) return activeSession;

  const config = resolveConfig();

  if (config.hub) {
    const hubClient = new NoxAeApiNetworkHubClient({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
    });

    const singleClient = new NoxAeApiClient({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
    });

    activeSession = {
      config,
      hubClient,
      singleClient,
      isHub: true,
      getClient(nodeId?: string) {
        if (nodeId && hubClient) {
          return hubClient.node(nodeId);
        }
        return singleClient;
      },
      async getDefaultNodeId() {
        if (cachedDefaultNode && cachedDefaultNode.expires > Date.now()) {
          return cachedDefaultNode.id;
        }
        try {
          const nodes = await hubClient.network.statusAll();
          if (Array.isArray(nodes) && nodes.length > 0) {
            // Pick first online node, or first node in list
            const online = nodes.find((n: any) => n.online || n.status === "online") || nodes[0];
            const id = online.name || online.id || online.nodeId;
            if (id) {
              cachedDefaultNode = { id: String(id), expires: Date.now() + 20_000 };
              return String(id);
            }
          }
        } catch {}
        return undefined;
      },
      async resolveTargetClient(nodeId?: string) {
        if (nodeId) {
          return { client: hubClient.node(nodeId), effectiveNodeId: nodeId };
        }
        const defaultNode = await this.getDefaultNodeId();
        if (defaultNode) {
          return { client: hubClient.node(defaultNode), effectiveNodeId: defaultNode };
        }
        return { client: singleClient };
      },
    };
  } else {
    const singleClient = new NoxAeApiClient({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
    });

    activeSession = {
      config,
      hubClient: null,
      singleClient,
      isHub: false,
      getClient() {
        return singleClient;
      },
      async getDefaultNodeId() {
        return undefined;
      },
      async resolveTargetClient() {
        return { client: singleClient };
      },
    };
  }

  return activeSession;
}
