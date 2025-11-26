
// URL del template PDF TT2112
// Il file è hostato localmente su Cloud Run per garantire accessibilità anche dietro proxy aziendali.
// Fallback disponibile su GitHub per massima ridondanza.

// Primary source: PDF servito da Cloud Run (stesso dominio, bypassa proxy)
export const PDF_TEMPLATE_URL: string = "/tt2112-template.pdf";

// Fallback source: GitHub (per utenti esterni se Cloud Run ha problemi)
export const PDF_TEMPLATE_FALLBACK: string = "https://raw.githubusercontent.com/paselsoft/tt2112_form_online/2926bf56466c09f0babf8db7660f71316df508e6/TT2112%20(1).pdf";
