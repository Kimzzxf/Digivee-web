import { useLoginState } from "./useLoginState";
import { useLoginAuthHandlers } from "./useLoginAuthHandlers";

// Combines state + all step handlers into the single hook the Login page
// uses. Split into useLoginState / useLoginAuthHandlers to keep each file
// short — this is just the composition point.
export function useLoginForm() {
  const state = useLoginState();
  const authHandlers = useLoginAuthHandlers(state);

  return { ...state, ...authHandlers };
}
