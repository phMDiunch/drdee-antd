// src/shared/providers/user-provider.tsx
"use client";

import React, { createContext, useContext } from "react";
import type { UserCore } from "@/shared/types/user";

/**
 * User Context - shares user data from Server Component to Client Components
 * Best practice for Next.js App Router with RSC
 */
const UserContext = createContext<UserCore | null>(null);

type UserProviderProps = {
  children: React.ReactNode;
  user?: UserCore | null;
};

/**
 * UserProvider - wraps the app to provide user context
 * Should be used in layout.tsx to pass SSR user data
 *
 * @example
 * ```tsx
 * // In app/(private)/layout.tsx
 * const currentUser = await getSessionUser();
 * return (
 *   <UserProvider user={currentUser}>
 *     {children}
 *   </UserProvider>
 * );
 * ```
 */
export function UserProvider({ children, user }: UserProviderProps) {
  return (
    <UserContext.Provider value={user ?? null}>{children}</UserContext.Provider>
  );
}

/**
 * useCurrentUser - hook to access current user in Client Components
 * No loading state needed - user is already fetched via SSR
 *
 * @returns Current user or null if not authenticated
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user } = useCurrentUser();
 *   const isAdmin = user?.role === "admin";
 *   // ...
 * }
 * ```
 */
export function useCurrentUser() {
  const user = useContext(UserContext);

  // In development, warn if used outside provider
  if (process.env.NODE_ENV === "development" && user === undefined) {
    console.warn(
      "useCurrentUser must be used within UserProvider. " +
        "Make sure UserProvider wraps your component tree."
    );
  }

  return { user };
}
