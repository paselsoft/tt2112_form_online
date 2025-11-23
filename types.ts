export enum Gender {
  M = 'M',
  F = 'F'
}

export enum RequestType {
  NONE = '',
  CONSEGUIMENTO = 'CONSEGUIMENTO', // Exam
  DUPLICATO = 'DUPLICATO', // Duplicate/Conversion
  RICLASSIFICAZIONE = 'RICLASSIFICAZIONE' // Reclassification
}

export interface TT2112Data {
  cognome: string;
  nome: string;
  sesso: Gender;
  luogoNascita: string;
  provinciaNascita: string;
  dataNascita: string; // DD/MM/YYYY
  statoNascita: string;
  cittadinanza: string;
  codiceFiscale: string;
  
  residenzaComune: string;
  residenzaProvincia: string;
  residenzaVia: string; 
  residenzaCap: string;
  residenzaNumero: string;

  tipoRichiesta: RequestType;
  categoriaRichiesta: string; // E.g., B, A1
  
  // For Duplicate/Conversion
  categoriaPosseduta: string;
  
  // For Reclassification
  daCategoria: string;
  aCategoria: string;

  estremiPatente: string; // Existing license number if applicable
  
  // Meta for form submission
  telefono?: string;
  email?: string;
}

export const INITIAL_DATA: TT2112Data = {
  cognome: '',
  nome: '',
  sesso: Gender.M,
  luogoNascita: '',
  provinciaNascita: '',
  dataNascita: '',
  statoNascita: 'ITALIA',
  cittadinanza: 'ITALIANA',
  codiceFiscale: '',
  residenzaComune: '',
  residenzaProvincia: '',
  residenzaVia: '',
  residenzaNumero: '',
  residenzaCap: '',
  tipoRichiesta: RequestType.NONE,
  categoriaRichiesta: '',
  categoriaPosseduta: '',
  daCategoria: '',
  aCategoria: '',
  estremiPatente: '',
  telefono: '',
  email: ''
};

export interface ValidationErrors {
  [key: string]: string;
}
