import useSWRMutation from "swr/mutation";
import { api } from "../lib/fetcher";

async function registerUser(url: string, { arg }: { arg: any }) {
  const { uid, email, role, name } = arg;
  const response = await api.post(url, { uid, email, role, name });
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
