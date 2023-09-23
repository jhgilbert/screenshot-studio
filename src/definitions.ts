/*
This file contains any constants, schemas, or types that should
be the same throughout the code.
*/

import { z } from "zod";

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
