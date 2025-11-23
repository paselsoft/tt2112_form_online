import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { TT2112Data, RequestType } from "../types";

// Helper to convert mm to points (1 mm = 2.835 points)
const mm = (millimeters: number) => millimeters * 2.83465;

export const generateTT2112PDF = async (
  data: TT2112Data, 
  existingPdfBytes: ArrayBuffer,
  options: { xOffset: number, yOffset: number, showDebug?: boolean } = { xOffset: 0, yOffset: 0, showDebug: false }
) => {
  try {
    // Load the existing PDF
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    // Courier Standard (not Bold) is usually better for fitting text in boxes
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
    const pages = pdfDoc.getPages();

    // BASE COORDINATES (Optimized for Page 2 / Index 1)
    const BASE_COORDS = {
        cognome: { x: 41, y: 53 },
        nome: { x: 41, y: 65.5 },
        sesso: { x: 153.0, y: 65.5 },
        luogoNascita: { x: 40, y: 88 },
        provinciaNascita: { x: 174, y: 88 },
        // statoNascita is commented out in logic
        dataNascita: { x: 68, y: 101 },
        cittadinanza: { x: 127, y: 101 },
        codiceFiscale: { x: 41, y: 111.5 },
        residenzaComune: { x: 41, y: 124.0 },
        residenzaProvincia: { x: 181.5, y: 124.0 },
        residenzaVia: { x: 40, y: 137 },
        residenzaNumero: { x: 147, y: 137 },
        residenzaCap: { x: 181, y: 137 },
        conseguimentoCheck: { x: 15, y: 157 },
        categoriaRichiesta: { x: 158, y: 157 },
        duplicatoCheck: { x: 18, y: 177 },
        duplicatoCat: { x: 138, y: 177 },
        riclassificazioneCheck: { x: 18, y: 190 },
        riclassificazioneDa: { x: 118, y: 190 },
        riclassificazioneA: { x: 158, y: 190 },
        estremiPatente: { x: 140, y: 209 }
    };

    // SPECIFIC OVERRIDES BY PAGE INDEX
    const PAGE_COORDINATES: Record<number, Partial<typeof BASE_COORDS>> = {
        // PAGE 4 (Index 3) - User Provided Coordinates
        3: {
            cognome: { x: 41, y: 55 },
            nome: { x: 41, y: 67 },
            sesso: { x: 153, y: 67 },
            luogoNascita: { x: 41, y: 89 },
            provinciaNascita: { x: 174, y: 89 },
            dataNascita: { x: 68, y: 102 },
            cittadinanza: { x: 127, y: 102 },
            codiceFiscale: { x: 41, y: 113 },
            residenzaComune: { x: 41, y: 125 },
            residenzaProvincia: { x: 182, y: 125 },
            residenzaVia: { x: 41, y: 138 },
            residenzaNumero: { x: 147, y: 138 },
            residenzaCap: { x: 181, y: 138 },
            conseguimentoCheck: { x: 15, y: 161 },
            categoriaRichiesta: { x: 158, y: 161 },
            
            // Heuristic estimates for other fields on Page 4 if needed (shifted similarly)
            duplicatoCheck: { x: 18, y: 181 }, 
            duplicatoCat: { x: 138, y: 181 },
            riclassificazioneCheck: { x: 18, y: 194 },
            riclassificazioneDa: { x: 118, y: 194 },
            riclassificazioneA: { x: 158, y: 194 },
            estremiPatente: { x: 140, y: 213 }
        },
        
        // PAGE 5 (Index 4) - User Provided Coordinates
        4: {
            cognome: { x: 41, y: 54 },
            nome: { x: 41, y: 66 },
            sesso: { x: 153, y: 64 },
            
            luogoNascita: { x: 41, y: 84 },
            provinciaNascita: { x: 174, y: 87 },
            
            dataNascita: { x: 68, y: 98 },
            cittadinanza: { x: 127, y: 98 },
            
            codiceFiscale: { x: 41, y: 106 },
            
            residenzaComune: { x: 41, y: 119 },
            residenzaProvincia: { x: 182, y: 119 },
            
            residenzaVia: { x: 41, y: 132 },
            residenzaNumero: { x: 147, y: 132 },
            residenzaCap: { x: 181, y: 132 },
            
            conseguimentoCheck: { x: 15, y: 154 },
            categoriaRichiesta: { x: 158, y: 153 },

            // Heuristics for bottom fields based on shifts
            duplicatoCheck: { x: 18, y: 174 },
            duplicatoCat: { x: 138, y: 174 },
            riclassificazioneCheck: { x: 18, y: 187 },
            riclassificazioneDa: { x: 118, y: 187 },
            riclassificazioneA: { x: 158, y: 187 },
            estremiPatente: { x: 140, y: 206 }
        },

        // PAGE 6 (Index 5) - User Provided Coordinates
        5: {
            cognome: { x: 41, y: 55 },
            nome: { x: 41, y: 67 },
            sesso: { x: 153, y: 67 },
            
            luogoNascita: { x: 41, y: 89 },
            provinciaNascita: { x: 174, y: 89 },
            
            dataNascita: { x: 68, y: 102 },
            cittadinanza: { x: 127, y: 102 },
            
            codiceFiscale: { x: 41, y: 113 },
            
            residenzaComune: { x: 41, y: 125 },
            residenzaProvincia: { x: 182, y: 125 },
            
            residenzaVia: { x: 41, y: 138 },
            residenzaNumero: { x: 147, y: 138 },
            residenzaCap: { x: 181, y: 138 },
            
            conseguimentoCheck: { x: 15, y: 159 },
            categoriaRichiesta: { x: 158, y: 159 },

            // Heuristics for bottom fields based on shifts relative to Conseguimento
            duplicatoCheck: { x: 18, y: 179 }, 
            duplicatoCat: { x: 138, y: 179 },
            riclassificazioneCheck: { x: 18, y: 192 },
            riclassificazioneDa: { x: 118, y: 192 },
            riclassificazioneA: { x: 158, y: 192 },
            estremiPatente: { x: 140, y: 211 }
        }
    };

    const getCoords = (pageIndex: number, field: keyof typeof BASE_COORDS) => {
        const overrides = PAGE_COORDINATES[pageIndex];
        if (overrides && overrides[field]) {
            return overrides[field]!;
        }
        return BASE_COORDS[field];
    };

    // Function to draw text at mm coordinates (origin top-left)
    const drawText = (pageIndex: number, text: string, coords: {x: number, y: number}, size: number = 10, centered: boolean = false) => {
      if (pageIndex >= pages.length) return;
      const page = pages[pageIndex];
      const { height } = page.getSize();
      
      // Apply global calibration offsets
      const finalXMm = coords.x + options.xOffset;
      const finalYMm = coords.y + options.yOffset;

      // Convert mm to points
      const x = mm(finalXMm);
      const y = height - mm(finalYMm); // pdf-lib uses bottom-left origin

      if (options.showDebug) {
          // Draw coordinate label for debug
          const label = `x:${Math.round(finalXMm)} y:${Math.round(finalYMm)}`;
          page.drawText(label, {
              x: x,
              y: y + 5, // slightly above
              size: 6,
              font: courierFont,
              color: rgb(1, 0, 0), // RED
          });
      }

      if (!text) return;
      
      const textStr = text.toUpperCase();

      if (centered) {
        const width = courierFont.widthOfTextAtSize(textStr, size);
        page.drawText(textStr, {
            x: x - (width / 2),
            y: y,
            size: size,
            font: courierFont,
            color: rgb(0, 0, 0),
        });
      } else {
        page.drawText(textStr, {
            x: x,
            y: y,
            size: size,
            font: courierFont,
            color: rgb(0, 0, 0),
        });
      }
    };

    // Function to draw an 'X' in a checkbox
    const drawCheck = (pageIndex: number, checked: boolean, coords: {x: number, y: number}) => {
      if (checked) {
        drawText(pageIndex, "X", coords, 12, true);
      }
    };

    const formPages = [1, 3, 4, 5]; // Pages 2, 4, 5, 6 (0-indexed)
    const FONT_SIZE = 10;

    formPages.forEach(pageIdx => {
        // Fetch coordinates dynamically for this page
        
        // Cognome
        drawText(pageIdx, data.cognome, getCoords(pageIdx, 'cognome'), FONT_SIZE); 
        
        // Nome
        drawText(pageIdx, data.nome, getCoords(pageIdx, 'nome'), FONT_SIZE);    
        
        // Sesso
        drawText(pageIdx, data.sesso, getCoords(pageIdx, 'sesso'), FONT_SIZE); 

        // Luogo Nascita
        drawText(pageIdx, data.luogoNascita, getCoords(pageIdx, 'luogoNascita'), FONT_SIZE);
        
        // Prov Nascita
        drawText(pageIdx, data.provinciaNascita, getCoords(pageIdx, 'provinciaNascita'), FONT_SIZE);
        
        // Data Nascita
        drawText(pageIdx, data.dataNascita, getCoords(pageIdx, 'dataNascita'), FONT_SIZE);         
        
        // Cittadinanza
        drawText(pageIdx, data.cittadinanza, getCoords(pageIdx, 'cittadinanza'), FONT_SIZE);       
        
        // Codice Fiscale
        drawText(pageIdx, data.codiceFiscale, getCoords(pageIdx, 'codiceFiscale'), 12);

        // Residenza Comune
        drawText(pageIdx, data.residenzaComune, getCoords(pageIdx, 'residenzaComune'), FONT_SIZE);    
        
        // Residenza Provincia
        drawText(pageIdx, data.residenzaProvincia, getCoords(pageIdx, 'residenzaProvincia'), FONT_SIZE);    
        
        // Residenza Via
        drawText(pageIdx, data.residenzaVia, getCoords(pageIdx, 'residenzaVia'), FONT_SIZE);       
        
        // Residenza Numero
        drawText(pageIdx, data.residenzaNumero, getCoords(pageIdx, 'residenzaNumero'), FONT_SIZE);       
        
        // Residenza CAP
        drawText(pageIdx, data.residenzaCap, getCoords(pageIdx, 'residenzaCap'), FONT_SIZE);          

        // Requests
        // 1. Conseguimento
        drawCheck(pageIdx, data.tipoRichiesta === RequestType.CONSEGUIMENTO, getCoords(pageIdx, 'conseguimentoCheck')); 
        
        if (data.tipoRichiesta === RequestType.CONSEGUIMENTO) {
            drawText(pageIdx, data.categoriaRichiesta, getCoords(pageIdx, 'categoriaRichiesta'), 12);
        }

        // 2. Duplicato / Conversione
        drawCheck(pageIdx, data.tipoRichiesta === RequestType.DUPLICATO, getCoords(pageIdx, 'duplicatoCheck')); 
        if (data.tipoRichiesta === RequestType.DUPLICATO) {
            drawText(pageIdx, data.categoriaPosseduta, getCoords(pageIdx, 'duplicatoCat'), FONT_SIZE); 
        }

        // 3. Riclassificazione
        drawCheck(pageIdx, data.tipoRichiesta === RequestType.RICLASSIFICAZIONE, getCoords(pageIdx, 'riclassificazioneCheck')); 
        if (data.tipoRichiesta === RequestType.RICLASSIFICAZIONE) {
            drawText(pageIdx, data.daCategoria, getCoords(pageIdx, 'riclassificazioneDa'), FONT_SIZE); 
            drawText(pageIdx, data.aCategoria, getCoords(pageIdx, 'riclassificazioneA'), FONT_SIZE);  
        }

        // Estremi Patente
        if (data.estremiPatente) {
            drawText(pageIdx, data.estremiPatente, getCoords(pageIdx, 'estremiPatente'), FONT_SIZE);
        }
    });

    // --- CONTACT INFO (Page 2, 4, 6) ---
    // Page 2 is Index 1. Page 4 is Index 3. Page 6 is Index 5.
    [1, 3, 5].forEach(pageIdx => {
        // Y=270mm is bottom margin (above internal office fields)
        const contactY = 270; 
        
        if (data.telefono) {
            drawText(pageIdx, `TEL: ${data.telefono}`, { x: 30, y: contactY }, FONT_SIZE);
        }
        if (data.email) {
            drawText(pageIdx, `EMAIL: ${data.email}`, { x: 100, y: contactY }, FONT_SIZE);
        }
    });

    // --- PAGE 7 (Foto & Tessere) ---
    const page7Idx = 6;
    if (page7Idx < pages.length) {
        // Coordinates updated per user request: X:28 y:92 for Cognome, X:63 y:92 for Nome
        drawText(page7Idx, data.cognome, {x: 28, y: 92}, FONT_SIZE); 
        drawText(page7Idx, data.nome, {x: 63, y: 92}, FONT_SIZE);    
    }

    // --- PAGE 14 (Privacy Consent) ---
    // Logic removed as requested (page remains empty)
    
    // Save the modified PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;

  } catch (error) {
    console.error("Error filling PDF:", error);
    throw new Error("Impossibile compilare il PDF. Assicurati che sia il file TT2112 corretto.");
  }
};