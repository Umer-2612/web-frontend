import { COMPONENT_TYPES, DRAG_MIME, type ComponentType } from "@/lib/system-design/catalog";

export { DRAG_MIME };

export function isComponentType(value: string): value is ComponentType {
  return (COMPONENT_TYPES as readonly string[]).includes(value);
}
