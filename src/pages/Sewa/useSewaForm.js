import { useSewaFieldState } from "./useSewaFieldState";
import { useSewaFieldHandlers } from "./useSewaFieldHandlers";

// Combines field state + change handlers into the single hook the Sewa
// page uses. Split into useSewaFieldState / useSewaFieldHandlers to keep
// each file short — this is just the composition point.
export function useSewaForm() {
  const state = useSewaFieldState();
  const handlers = useSewaFieldHandlers(state);
  return { ...state, ...handlers };
}
