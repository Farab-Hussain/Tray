import useSWRMutation from "swr/mutation";
import { api } from "../lib/fetcher";

async function registerUser(url: string, { arg }: { arg: { email: string; accountType: string; name?: string } }) {
  const { email, accountType, name } = arg;
  const response = await api.post(url, { email, accountType, ...(name ? { name } : {}) });
  return response.data;
}

export const useRegister = () => {
  const { trigger, data, error, isMutating } = useSWRMutation('/auth/register', registerUser);
  return {
    register: trigger,
    data,
    error,
    isLoading: isMutating,
  };
};
