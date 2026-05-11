import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({

            user: null,
            role: null,
            token: null,

            login: (userData, role, token) => {
                set({
                    user: userData,
                    role,
                    token
                });
            },

            logout: () => {
                set({
                    user: null,
                    role: null,
                    token: null
                });
            }

        }),
        {
            name: 'auth-storage'
        }
    )
);