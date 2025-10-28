import { signInWithEmailAndPassword } from "firebase/auth";
import useSWRMutation from "swr/mutation"
import { auth } from "../lib/firebase";
import { api } from "../lib/fetcher";

async function loginUser(url: string, { arg }: { arg: any }) {
    const { email, password } = arg;
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user;

    const token = await user.getIdToken();

    const response = await api.get(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
}

export const useLogin = () => {
    const { trigger, data, error, isMutating } = useSWRMutation('/auth/login', loginUser);
    return {
        login: trigger,
        data,
        error,
        isLoading: isMutating
    }
}