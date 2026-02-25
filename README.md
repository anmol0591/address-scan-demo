# Address Scan from Image (prototype)

Amazon-style address form with a **Scan from image** button. Pick an image (camera or photo library), run OCR, parse address fields, review in a modal, then apply to the form.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Gemini API key (required for address parsing)

Address parsing uses **Gemini** to extract fields from the OCR text (postal code, city, state, address lines, landmark, etc.).

1. Get an API key: [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a `.env` file in the project root (copy from `.env.example`):
   ```
   VITE_GEMINI_API_KEY=your_key_here
   ```
3. Restart the dev server after changing `.env`.

If the key is missing, the app will show an error when you tap "Scan from image" and try to parse.

## Build for production

```bash
npm run build
```

Serves from `dist/`. Preview:

```bash
npm run preview
```

## Tests

```bash
npm run test
```

Runs parser unit tests (Indian multi-line, US City/ST ZIP, messy screenshot, Hinglish landmark).

## Using real OCR (Tesseract.js)

The app defaults to **MockOcrEngine** (hardcoded sample text) so it runs without extra deps.

To use real client-side OCR:

1. Install Tesseract.js:
   ```bash
   npm install tesseract.js
   ```
2. In your screen, use `RealOcrEngine` instead of `MockOcrEngine`:
   ```ts
   import { RealOcrEngine } from '../ocr/OcrEngine'
   const ocrEngine = new RealOcrEngine()
   ```

For production you may replace `RealOcrEngine` with a backend (e.g. Google Cloud Vision) or native mobile OCR; the `OcrEngine` interface stays the same.

## Deploy on Railway

- **Static site**: Build with `npm run build`, then serve the `dist/` folder (e.g. use Railway’s static site or a simple server).
- **Node server**: Use a small Express (or similar) app that serves `dist/index.html` and static assets from `dist/`.

Example minimal server (add to repo if you prefer):

```js
// server.js
const express = require('express')
const path = require('path')
const app = express()
app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))
app.listen(process.env.PORT || 3000)
```

No environment variables are required for the prototype. Add API keys only if you introduce server-side OCR.

## Parsing

Address parsing uses **Gemini** (gemini-1.5-flash) to extract fields from the full OCR text: fullName, phone, addressLine1, addressLine2, landmark, city, stateOrProvince, postalCode, country. It handles chat screenshots and Indian format. Set VITE_GEMINI_API_KEY in .env.

## Project layout 6-digit pincode, state names, “Near …” landmarks, “City - 560001”.
- **US**: 5/9-digit ZIP, “City, ST 12345”.

Confidence is per field (0–1). The review modal shows High/Medium/Low and lets you edit before applying. You can extend `parseAddressFromText` and `stateLists` for more regions or formats. This build is **India-first** and supports **Hinglish/Hindi** landmarks (e.g. "temple ke peeche", "X ke paas").

## Project layout

| Area        | Path |
|------------|------|
| Form UI    | `src/screens/AddressFormScreen.tsx`, `src/components/ScanFromImageButton.tsx` |
| Review     | `src/components/ReviewAddressModal.tsx` |
| OCR        | `src/ocr/OcrEngine.ts` (interface + Mock + Real) |
| Parser     | `src/parser/geminiAddressParser.ts`, `src/parser/parseAddressFromText.ts`, `src/parser/stateLists.ts` |
| Form state | `src/hooks/useAddressForm.ts` |
| Tests      | `src/parser/parseAddressFromText.test.ts` |
