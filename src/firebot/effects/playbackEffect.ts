import { Effects } from "@crowbartools/firebot-custom-scripts-types/types/effects";
import { logger } from "../../modules";
import { toErrorReason } from "../../services/api";
import { namespaced } from "../../shared/constants";
import { ErrorReason } from "../../shared/types";

type Model = Record<string, never>;

interface Outputs {
  success: boolean;
  errorReason: ErrorReason | "";
}

/**
 * Builds a no-option playback-control effect that runs a single API action and
 * reports `success` plus an `errorReason` (e.g. `no-active-device`/`not-premium`).
 */
export function makePlaybackEffect(opts: {
  id: string;
  name: string;
  description: string;
  icon: string;
  action: () => Promise<void>;
}): Effects.EffectType<Model, unknown, Outputs> {
  return {
    definition: {
      id: namespaced(opts.id),
      name: opts.name,
      description: opts.description,
      icon: opts.icon,
      categories: ["integrations"],
      outputs: [
        { label: "Success", description: "Whether the action succeeded.", defaultName: "success" },
        {
          label: "Error Reason",
          description: "Failure reason, when the action fails.",
          defaultName: "errorReason",
        },
      ],
    },
    optionsTemplate: `
      <eos-container header="${opts.name}">
        <p class="muted">${opts.description} This effect has no options.</p>
      </eos-container>
    `,
    onTriggerEvent: async () => {
      try {
        await opts.action();
        return { success: true, outputs: { success: true, errorReason: "" } };
      } catch (error) {
        logger.warn(`${opts.name} failed: ${String(error)}`);
        return { success: false, outputs: { success: false, errorReason: toErrorReason(error) } };
      }
    },
  };
}
