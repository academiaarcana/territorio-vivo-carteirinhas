const config = window.TERRITORIO_VIVO_CONFIG || {};

if (!config.supabaseUrl || !config.supabasePublishableKey) {
  throw new Error('Configuração do Supabase ausente.');
}
if (!window.supabase?.createClient) {
  throw new Error('Biblioteca do Supabase não carregada.');
}

export const supabase = window.supabase.createClient(
  config.supabaseUrl,
  config.supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export const appConfig = Object.freeze({
  publicUrl: config.publicUrl || `${location.origin}${location.pathname}`
});
