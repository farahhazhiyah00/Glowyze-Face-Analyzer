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

Gunakan Bahasa Indonesia yang hangat. Tambahkan emoji sesekali â¨.`;

const VISION_PROMPT = `Analisis foto wajah ini sebagai AI Glowy (pakar AI kecantikan). 
Berikan laporan yang meliputi:
1. Kondisi visual kulit (deteksi jerawat, kerutan, pigmentasi, atau tekstur).
2. Perkiraan jenis kulit.
3. 3-5 hero ingredients yang direkomendasikan.
4. Tips perawatan jangka pendek.

WAJIB RESPON DALAM JSON:
{
  "overallScore": number (0-100),
  "metrics": {
    "acne": number (0-100 severity),
    "wrinkles": number (0-100 severity),
    "pigmentation": number (0-100 severity),
    "texture": number (0-100 unevenness)
  },
  "summary": "Teks narasi markdown yang detail dan empatik."
}`;

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT' });
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
      config: { systemInstruction: instruction },
      history
    });
  }

  public async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) await this.startChat();
    try {
      const result = await this.chatSession!.sendMessage({ message });
      return result.text || "Duh, Glowy lagi ngelamun sebentar. Bisa ulangi? â¨";
    } catch (e) {
      console.error(e);
      return "Sinyal Glowy lagi kurang stabil nih bestie, coba lagi ya! ð¸";
    }
  }

  public async analyzeSkin(base64Image: string): Promise<ScanResult> {
    try {
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
            { text: VISION_PROMPT }
          ]
        },
        config: { responseMimeType: 'application/json' }
      });

      const data = JSON.parse(response.text || '{}');
      return {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        imageUri: base64Image,
        overallScore: data.overallScore || 70,
        metrics: data.metrics || { acne: 10, wrinkles: 5, pigmentation: 10, texture: 15 },
        summary: data.summary || "Analisis visual selesai. Tetap semangat merawat kulit ya!"
      };
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}

export const geminiService = new GeminiService();