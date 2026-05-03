import { GoogleGenAI, Type } from "@google/genai";
import { Message, InterviewConfig, EvaluationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateInterviewQuestion(
  config: InterviewConfig,
  history: Message[]
): Promise<string> {
  const systemInstruction = `
    你是一位来自 ${config.companyName || '顶尖科技公司'} 的面试官专家。
    面试类别：${config.track}
    职位名称：${config.role}
    难度级别：${config.difficulty}
    ${config.resumeText ? `候选人简历信息：${config.resumeText}` : ''}

    规则：
    1. 保持专业形象，语气应当有挑战性但公平。
    2. 必须全程使用中文交流。
    3. 每次只问一个问题。
    4. 根据候选人的回答进行追问，或在适当时切换到新话题。
    5. 如果是技术面试，重点考察逻辑和伪代码，而不是完美的语法。
    6. 保持回答简洁，专注于面试流程。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      { role: 'user', parts: [{ text: history.length === 0 ? "面试开始。请简短地自我介绍并提出第一个问题。" : "请根据我上一个回答继续面试。" }] }
    ],
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  return response.text || "非常抱歉，我遇到了一些问题。能请你再重复一遍吗？";
}

export async function evaluateInterview(
  config: InterviewConfig,
  history: Message[]
): Promise<EvaluationResult> {
  const prompt = `
    请分析以下 AI 面试官与候选人之间的面谈记录。
    面试配置：${JSON.stringify(config)}
    
    面试笔录：
    ${history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

    请以 JSON 格式提供详细的评估结果。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          communicationScore: { type: Type.NUMBER },
          technicalScore: { type: Type.NUMBER },
          problemSolvingScore: { type: Type.NUMBER },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          detailedFeedback: { type: Type.STRING },
        },
        required: ["overallScore", "communicationScore", "technicalScore", "problemSolvingScore", "strengths", "improvements", "detailedFeedback"],
      },
    },
  });

  return JSON.parse(response.text!) as EvaluationResult;
}

export async function analyzeResumeText(resumeText: string) {
  const prompt = `你是一位专业的资深 HR 兼技术面试官。请阅读并分析以下简历内容，给出详细的优化建议。
简历内容：
${resumeText}

请按照 JSON 格式返回分析结果。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["overallScore", "summary", "strengths", "weaknesses", "suggestions"],
      },
    },
  });

  return JSON.parse(response.text!);
}

export async function speechToText(audioBase64: string): Promise<string> {
  // Mocking STT since browser native is often better or use Gemini Multimodal
  // For now, we recommend users type or use native browser voice typing
  return "";
}

export async function textToSpeech(text: string): Promise<string | undefined> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Read professionally: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return undefined;
  }
}
