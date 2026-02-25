/**
 * OCR engine interface. Implementations extract text from an image (File or Blob).
 * For production you may replace RealOcrEngine with a backend (e.g. Google Vision)
 * or native iOS/Android OCR.
 */
export interface OcrEngine {
  recognize(image: File | Blob): Promise<string>
}

/**
 * Returns hardcoded sample text so the address flow works without Tesseract.
 * Includes Hinglish landmark ("temple ke peeche") for India-first demo.
 */
export class MockOcrEngine implements OcrEngine {
  async recognize(): Promise<string> {
    return `Anmol Srivastava
9916421310
Flat 101, Sunrise Apartments
Sector 5, DLF Phase 2
temple ke peeche
Gurgaon - 122002
Haryana
India`
  }
}

/**
 * Real OCR using Tesseract.js in the browser.
 * Install: npm install tesseract.js
 * For production consider server-side OCR (Google Vision, etc.) or native mobile OCR.
 */
export class RealOcrEngine implements OcrEngine {
  async recognize(image: File | Blob): Promise<string> {
    try {
      // Dynamic import so the app works without tesseract.js installed
      const Tesseract = await import('tesseract.js')
      const { data } = await Tesseract.recognize(image, 'eng', {
        logger: () => {},
      })
      return data.text ?? ''
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OCR failed'
      throw new Error(`OCR failed: ${message}`)
    }
  }
}
