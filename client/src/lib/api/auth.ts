
import { useAuth, useClerk, useUser } from "@clerk/nextjs";

export function useCurrentUser() {
    const { user, isLoaded, isSignedIn } = useUser();

    return {
        user: user
            ? {
                  id: user.id,
                  name:
                      user.fullName ||
                      user.firstName ||
                      "DocuMind User",
                  email:
                      user.primaryEmailAddress?.emailAddress || "",
                  imageUrl: user.imageUrl,
              }
            : null,
        isLoaded,
        isSignedIn,
    };
}


export function useAuthToken() {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    return {
        getToken,
        isLoaded,
        isSignedIn,
    };
}


export function useLogout() {
    const { signOut } = useClerk();

    return {
        logout: () => signOut({
            redirectUrl: "/login",
        }),
    };
}
