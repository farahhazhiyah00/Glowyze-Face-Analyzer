
import { GoogleGenAI, Chat, Content } from "@google/genai";
import { UserProfile, ScanResult, ChatMessage } from "../types";

const CHAT_SYSTEM_INSTRUCTION = `Kamu adalah Glowy, asisten kecantikan virtual (beauty bestie) untuk Glowyze. 
Gayamu ramah, suportif, dan sangat paham tentang dermatologi estetika.

TUGASMU:
1. Bantu pengguna memahami kondisi kulit mereka berdasarkan data profil atau keluhan.
2. Rekomendasikan bahan aktif (ingredients) yang tepat, bukan hanya merek.
3. Berikan saran rutinitas CTMP (Cleanse, Tone, Moisturize, Protect).
4. Berikan edukasi tentang gaya hidup sehat untuk kulit.
5. SELALU berikan disclaimer bahwa kamu adalah AI, bukan pengganti Dermatolog jika ada masalah serius.

Gunakan Bahasa Indonesia yang hangat. Tambahkan emoji sesekali ✨.`;

const VISION_PROMPT = `Analisis foto wajah ini sebagai AI Glowy (pakar AI kecantikan). 
Tugasmu adalah melakukan deteksi visual terhadap kondisi kulit.

WAJIB MEMBERIKAN RESPON DALAM FORMAT JSON MURNI:
{
  "overallScore": number (berikan nilai 0-100, 100 adalah kulit sangat sehat),
  "metrics": {
    "acne": number (0-100 tingkat keparahan jerawat),
    "wrinkles": number (0-100 tingkat keparahan kerutan),
    "pigmentation": number (0-100 tingkat keparahan noda/pigmentasi),
    "texture": number (0-100 tingkat ketidakrataan tekstur)
  },
  "summary": "Berikan narasi detail dalam Bahasa Indonesia. Gunakan Markdown untuk formatting seperti **bold** untuk penekanan. Berikan tips konkret dan 3 hero ingredients yang disarankan."
}

PENTING: JANGAN sertakan kata-kata pembuka atau penutup. JANGAN gunakan block code markdown (\`\`\`json). Berikan JSON mentah saja.`;

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;

  constructor() {
    // Pastikan API_KEY tersedia. Jika di Vercel, pastikan sudah di-set di environment variables dashboard.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API_KEY tidak ditemukan. Pastikan sudah di-set di Vercel/Environment Variables.");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || "" });
  }

  public async startChat(userProfile?: UserProfile, historyMessages?: ChatMessage[]) {
    let instruction = CHAT_SYSTEM_INSTRUCTION;
    if (userProfile) {
      instruction += `\n\nKonteks Pengguna: Nama ${userProfile.name}, Tipe Kulit ${userProfile.skinType}, Fokus ${userProfile.stressLevel} stress.`;
    }

    const history: Content[] = historyMessages?.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    })) || [];

    this.chatSession = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { 
        systemInstruction: instruction,
        thinkingConfig: { thinkingBudget: 0 } // Chat tidak butuh thinking budget tinggi agar cepat
      },
      history
    });
  }

  public async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) await this.startChat();
    try {
      const result = await this.chatSession!.sendMessage({ message });
      return result.text || "Duh, Glowy lagi ngelamun sebentar. Bisa ulangi? ✨";
    } catch (e) {
      console.error("Chat Error:", e);
      return "Sinyal Glowy lagi kurang stabil nih bestie, coba lagi ya! 🌸";
    }
  }

  public async analyzeSkin(base64Image: string): Promise<ScanResult> {
    try {
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
            { text: VISION_PROMPT }
          ]
        },
        config: { 
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 15000 } // Memberikan ruang berpikir untuk analisis visual yang akurat
        }
      });

      // Membersihkan response text dari kemungkinan markdown backticks
      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

      const data = JSON.parse(responseText);
      
      return {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        imageUri: base64Image,
        overallScore: data.overallScore || 70,
        metrics: data.metrics || { acne: 10, wrinkles: 5, pigmentation: 10, texture: 15 },
        summary: data.summary || "Analisis visual selesai. Tetap semangat merawat kulit ya!"
      };
    } catch (e) {
      console.error("Analysis Failed Error:", e);
      throw new Error("Gagal menganalisis gambar. Pastikan pencahayaan cukup dan wajah terlihat jelas.");
    }
  }
}

export const geminiService = new GeminiService();
