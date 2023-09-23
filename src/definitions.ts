/*
This file contains any constants, schemas, or types that should
be the same throughout the code.
*/

import { z } from "zod";

// Element classes
export const SELECTED_NODE_CLASS = "screenshot-studio-selected-element";
export const LABEL_TAB_CLASS = "screenshot-studio-label";
export const LABELED_NODE_CLASS = "screenshot-studio-labeled-element";
export const SHOWCASED_NODE_CLASS = "screenshot-studio-showcased-element";

// Selected node
export const SelectedNodeAttrsSchema = z
  .object({
    innerText: z.string(),
    isLabeled: z.boolean(),
    isHidden: z.boolean(),
    isBlurred: z.boolean(),
    isShowcased: z.boolean(),
  })
  .strict();

export type SelectedNodeAttrs = z.infer<typeof SelectedNodeAttrsSchema>;

// Extension state
export const ExtensionStateSchema = z
  .object({
    extensionIsActive: z.boolean(),
    nodeIsSelected: z.boolean(),
    selectedNodeAttrs: SelectedNodeAttrsSchema.optional(),
  })
  .strict();

export type ExtensionState = z.infer<typeof ExtensionStateSchema>;
