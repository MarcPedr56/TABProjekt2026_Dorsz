import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: null,
    role: null,
    token: localStorage.getItem('token') || null,
    
    login: (userData, role, token) => {
        localStorage.setItem('token', token);
        set({ user: userData, role, token });
    },
    
    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, role: null, token: null });
    }
}));