
import { GoogleGenAI, Chat, Content, Type } from "@google/genai";
import { UserProfile, ScanResult, ChatMessage } from "../types";

const CHAT_SYSTEM_INSTRUCTION = `Kamu adalah Glowy, asisten kecantikan virtual (beauty bestie) untuk Glowyze. 
Gayamu ramah, suportif, dan sangat paham tentang dermatologi estetika tingkat lanjut.

TUGASMU:
1. Bantu pengguna memahami kondisi kulit mereka berdasarkan data profil atau keluhan menggunakan logika medis yang akurat.
2. Rekomendasikan bahan aktif (ingredients) yang tepat, jelaskan mekanisme kerjanya secara saintifik namun mudah dimengerti.
3. Berikan saran rutinitas CTMP (Cleanse, Tone, Moisturize, Protect) yang dipersonalisasi.
4. Berikan edukasi tentang gaya hidup sehat dan dampaknya pada kesehatan kulit jangka panjang.
5. SELALU berikan disclaimer bahwa kamu adalah AI, bukan pengganti Dermatolog jika ada masalah serius.

Gunakan Bahasa Indonesia yang hangat. Tambahkan emoji sesekali ✨.`;

const VISION_PROMPT = `Analisis foto wajah ini dengan presisi tingkat tinggi sebagai AI Glowy (Advanced Beauty Expert). 
Lakukan deteksi visual mendalam terhadap pori-pori, hiperpigmentasi, garis halus, dan lesi jerawat. Berikan analisis dalam format JSON.`;

export class GeminiService {
  private chatSession: Chat | null = null;

  // Tidak lagi menginisialisasi AI di constructor untuk mematuhi aturan model Pro
  constructor() {}

  private getAIInstance() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    const ai = this.getAIInstance();
    this.chatSession = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { 
        systemInstruction: instruction,
        thinkingConfig: { thinkingBudget: 4000 }
      },
      history
    });
  }

  public async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) await this.startChat();
    try {
      const result = await this.chatSession!.sendMessage({ message });
      return result.text || "Glowy sedang memproses datamu... ✨";
    } catch (e: any) {
      console.error("Chat Error:", e);
      if (e.message?.includes("Requested entity was not found")) {
        throw new Error("MODEL_NOT_FOUND");
      }
      return "Sinyal Glowy lagi kurang stabil nih bestie, coba lagi ya! 🌸";
    }
  }

  public async analyzeSkin(base64Image: string): Promise<ScanResult> {
    const ai = this.getAIInstance();
    try {
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
            { text: VISION_PROMPT }
          ]
        },
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER },
              metrics: {
                type: Type.OBJECT,
                properties: {
                  acne: { type: Type.NUMBER },
                  wrinkles: { type: Type.NUMBER },
                  pigmentation: { type: Type.NUMBER },
                  texture: { type: Type.NUMBER }
                }
              },
              summary: { type: Type.STRING }
            },
            required: ["overallScore", "metrics", "summary"]
          },
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText);
      
      return {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        imageUri: base64Image,
        overallScore: data.overallScore || 70,
        metrics: data.metrics || { acne: 10, wrinkles: 5, pigmentation: 10, texture: 15 },
        summary: data.summary || "Analisis Pro selesai. Tetap semangat merawat kulit ya!"
      };
    } catch (e: any) {
      console.error("Analysis Failed:", e);
      if (e.message?.includes("Requested entity was not found")) {
        throw new Error("MODEL_NOT_FOUND");
      }
      throw new Error("Gagal menganalisis gambar. Pastikan pencahayaan cukup.");
    }
  }
}

export const geminiService = new GeminiService();
