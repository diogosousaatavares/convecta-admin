// Stub — Base44 SDK removido. Email e funções cloud serão ligados à tua API.
export const base44 = {
  auth: {
    me: async () => null,
    logout: () => {},
    redirectToLogin: () => { window.location.href = '/entrar'; }
  },
  functions: {
    invoke: async (name, payload) => {
      console.log(`[base44.functions] ${name}`, payload);
      return { data: null };
    }
  }
};
