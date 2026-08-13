export interface NestedItemsEditController {
  cancelActiveEdit?: () => void;
  saveBeforeClose?: () => Promise<void>;
}
